import { DownOutlined, FileSearchOutlined, FileTextOutlined } from '@ant-design/icons';
import {
  Switch as AntdSwitch,
  Button,
  Dropdown,
  Input,
  Modal,
  Pagination,
  Space,
  Switch,
  Table,
  message,
} from 'antd';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AddNewModal from '../components/AddNew/AddNew';
import HistoryBackupModal from '../components/Backup/HistoryBackupModal';
import RoundedBlackButton from '../components/Button/Button';
import Loading from '../components/Loading/Loading';
import Header from '../components/layouts/Header/Header';
import {
  deleteJob,
  deleteJobForever,
  getJobDelete,
  getJobs,
  restoreJob,
  toggleJob,
  fetchJobLogs,
} from '../services/jobServices';
import { debounce } from 'lodash';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import '../styles/Home.css';
ChartJS.register(ArcElement, Tooltip, Legend);

const Home = () => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editJobData, setEditJobData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const jobsPerPage = 7;
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [jobDelete, setJobDelete] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isJobDetailModalOpen, setIsJobDetailModalOpen] = useState(false);
  const [jobLogs, setJobLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const logsPerPage = 5;
  const language = useSelector((state) => state.language);
  const dispatch = useDispatch();

  // Hàm chuyển đổi ngôn ngữ
  const handleLanguageSwitch = (checked) => {
    dispatch({ type: 'SET_LANGUAGE', payload: checked ? 'ja' : 'en' });
  };

  const t = (en, ja) => (language === 'ja' ? ja : en);

  // Hàm lấy danh sách jobs từ backend và cập nhật state
  const updatedJobs = async () => {
    try {
      setIsLoading(true);
      const response = await getJobs();
      if (response) {
        setJobs(
          response.map((job) => ({
            ...job,
            stats: job.stats || { total: 0, success: 0, failed: 0 },
          })) || []
        );
        return response;
      }
    } catch (error) {
      console.log(error);

      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Tự động cập nhật danh sách jobs mỗi 30s
  useEffect(() => {
    updatedJobs();
    const interval = setInterval(() => {
      updatedJobs();
      if (jobs.some((job) => job.status === 'Success')) {
        message.info(t('Some jobs completed!', '一部のジョブが完了しました！'), 2);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  // Hàm tìm kiếm, để tránh gọi liên tục khi nhập
  const handleSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 300),
    []
  );

  const getDropdownItems = (record) => [
    {
      key: 'edit',
      label: (
        <span
          onClick={(e) => {
            e.stopPropagation();
            setEditJobData(record);
          }}
        >
          {t('Edit Job', '編集')}
        </span>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: (
        <span
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(record.id);
          }}
        >
          {t('Delete Job', '消去')}
        </span>
      ),
    },
  ];

  const handleDelete = (id) => {
    Modal.confirm({
      title: t(
        `Are you sure you want to delete job ${id}?`,
        `ジョブ ${id} を削除してもよろしいですか？`
      ),
      content: t('This job can be restored from Bin.', 'このジョブはごみ箱から復元できます。'),
      okText: t('Delete', '削除'),
      cancelText: t('Cancel', 'キャンセル'),
      async onOk() {
        try {
          setIsLoading(true);
          await deleteJob(id);
          setRefreshTrigger((prev) => prev + 1);
          message.success(t('Job deleted successfully!', 'ジョブが正常に削除されました！'));
        } catch (error) {
          message.error(t('Error deleting job.', 'ジョブの削除エラー'), error);
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const toggleJobStatus = async (id) => {
    try {
      setIsLoading(true);
      const response = await toggleJob(id);
      setJobs((prevJobs) =>
        prevJobs.map((job) => (job.id === id ? { ...job, is_active: response.job.is_active } : job))
      );
      message.success(
        t('Job status updated successfully!', 'ジョブのステータスが更新されました！')
      );
    } catch (error) {
      console.error('Error updating job status:', error);
      message.error(t('Error updating job status.', 'ジョブのステータス更新エラー'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobUpdated = () => {
    setEditJobData(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleHistoryButtonClick = () => {
    setIsHistoryModalVisible(true);
  };

  const openBackupModal = async () => {
    setIsBackupModalOpen(true);
    try {
      const logs = await getJobDelete();
      setJobDelete(logs);
    } catch (error) {
      console.error('Error fetching deleted jobs:', error);
    }
  };

  const closeBackupModal = () => {
    setIsBackupModalOpen(false);
    setJobDelete([]);
  };

  const handleRowClick = async (record, event) => {
    if (
      event.target.closest('.ant-switch') ||
      event.target.closest('.ant-dropdown-trigger') ||
      event.target.closest('button')
    ) {
      return;
    }
    setSelectedJob(record);
    setIsJobDetailModalOpen(true);
    setLogsLoading(true);
    try {
      const logs = await fetchJobLogs(record.id);
      setJobLogs(logs);
    } catch (error) {
      console.error('Error fetching job logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  // Hàm khôi phục job từ thùng rác
  const handleRestore = async (jobId) => {
    try {
      setIsLoading(true);
      await restoreJob(jobId);
      message.success(t('Job restored successfully!', 'ジョブが正常に復元されました！'));
      setRefreshTrigger((prev) => prev + 1);
      closeBackupModal();
    } catch (error) {
      console.error('Error restoring job:', error);
      message.error(t('Error restoring job.', 'ジョブの復元エラー'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteForever = (jobId) => {
    Modal.confirm({
      title: t(
        `Are you sure you want to delete job ${jobId} permanently?`,
        `ジョブ${jobId}を完全に削除しますか？`
      ),
      content: t('This action cannot be undone.', 'この操作は元に戻せません。'),
      okText: t('Delete', '削除'),
      cancelText: t('Cancel', 'キャンセル'),
      async onOk() {
        try {
          setIsLoading(true);
          await deleteJobForever(jobId);
          message.success(t('Job deleted permanently!', 'ジョブが完全に削除されました！'));
          setRefreshTrigger((prev) => prev + 1);
          closeBackupModal();
        } catch (error) {
          console.error('Error deleting job permanently:', error);
          message.error(t('Error deleting job permanently.', 'ジョブの完全削除エラー'));
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const jobArray = useMemo(() => Object.values(jobs), [jobs]);

  const filteredJobs = useMemo(() => {
    return jobArray.filter(
      (job) =>
        job.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.source_folder?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.destination_folder?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [jobArray, searchTerm]);

  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * jobsPerPage;
    return filteredJobs.slice(startIndex, startIndex + jobsPerPage);
  }, [filteredJobs, currentPage]);

  const totalJobs = filteredJobs.length;

  const columns = [
    {
      title: t('#', '番号'),
      key: 'id',
      dataIndex: 'id',
    },
    {
      title: t('Name', '名前'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('Status', 'ステータス'),
      dataIndex: 'status',
      key: 'status',
      render: (status, record) =>
        status === 'Fail' && record.error_message ? (
          <span title={record.error_message} style={{ color: 'red' }}>
            {status}
          </span>
        ) : (
          <span className={`status ${status?.toLowerCase()}`}>{status}</span>
        ),
    },
    {
      title: t('Schedule Job', '実行時刻 (JST)'),
      dataIndex: 'cron_schedule',
      key: 'time',
    },
    {
      title: t('Last Time Run', '最終実行時刻'),
      dataIndex: 'last_run_time',
      key: 'last_run_time',
      render: (value) =>
        value
          ? new Date(value).toLocaleString(language === 'ja' ? 'ja-JP' : 'en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
          : 'N/A',
    },
    {
      title: t('Action', '操作'),
      key: 'action',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Switch
            checked={record?.is_active}
            onChange={(checked, e) => {
              if (e && e.stopPropagation) e.stopPropagation();
              toggleJobStatus(record?.id);
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <Dropdown menu={{ items: getDropdownItems(record) }}>
            <a
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Space>
                {t('More', '詳細')}
                <DownOutlined />
              </Space>
            </a>
          </Dropdown>
        </div>
      ),
    },
  ];

  return (
    <div className="container">
      <Header
        language={language}
        t={t}
        handleLanguageSwitch={handleLanguageSwitch}
        openBackupModal={openBackupModal}
        handleHistoryButtonClick={handleHistoryButtonClick}
        setIsLoading={setIsLoading}
        refreshJobs={() => setRefreshTrigger((prev) => prev + 1)}
        editJobData={editJobData}
        setEditJobData={setEditJobData}
        handleJobUpdated={handleJobUpdated}
      />
      <div className="table-container">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
          <Input
            placeholder={t(
              'Search by name, source, or target folder',
              '名前、ソース、またはターゲットフォルダで検索'
            )}
            prefix={<FileSearchOutlined />}
            style={{ width: 300 }}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
          />
        </div>

        <div style={{ flexGrow: 1 }}>
          <Table
            columns={columns}
            dataSource={paginatedJobs}
            pagination={false}
            rowKey="id"
            scroll={{ y: 460 }}
            onRow={(record) => ({
              onClick: (event) => handleRowClick(record, event),
              style: { cursor: 'pointer' },
            })}
          />
        </div>

        <div className="pagination">
          <div>
            {t('Total Job:', 'ジョブ合計:')} <span className="total-job">{totalJobs}</span>
          </div>
          <Pagination
            current={currentPage}
            pageSize={jobsPerPage}
            total={totalJobs}
            onChange={(page) => setCurrentPage(page)}
            style={{ marginTop: '16px', textAlign: 'right' }}
          />
        </div>
      </div>

      <HistoryBackupModal
        visible={isHistoryModalVisible}
        onCancel={() => setIsHistoryModalVisible(false)}
      />

      <Modal
        title={t('Deleted Jobs', '削除されたジョブ')}
        open={isBackupModalOpen}
        onCancel={closeBackupModal}
        footer={null}
        width={800}
      >
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>{t('#', '番号')}</th>
                <th>{t('Name', '名前')}</th>
                <th>{t('Cron Schedule', 'Cronスケジュール')}</th>
                <th>{t('Last Run', '最終実行')}</th>
                <th>{t('Status', '状態')}</th>
                <th>{t('Action', '操作')}</th>
              </tr>
            </thead>
            <tbody>
              {jobDelete.length > 0 ? (
                jobDelete
                  .slice((currentPage - 1) * jobsPerPage, currentPage * jobsPerPage)
                  .map((job, index) => (
                    <tr key={job.id}>
                      <td>{(currentPage - 1) * jobsPerPage + index + 1}</td>
                      <td>{job.name}</td>
                      <td>{job.cron_schedule}</td>
                      <td>
                        {job.last_run_time
                          ? new Date(job.last_run_time).toLocaleString(
                              language === 'ja' ? 'ja-JP' : 'en-US',
                              {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                              }
                            )
                          : 'N/A'}
                      </td>
                      <td>
                        {job.status === 'Fail' && job.error_message ? (
                          <span title={job.error_message} style={{ color: 'red' }}>
                            {job.status}
                          </span>
                        ) : (
                          job.status
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Dropdown
                            overlay={
                              <Space direction="vertical">
                                <Button onClick={() => handleRestore(job.id)}>
                                  {t('Restore', '復元')}
                                </Button>
                                <Button danger onClick={() => handleDeleteForever(job.id)}>
                                  {t('Delete Forever', '完全に削除')}
                                </Button>
                              </Space>
                            }
                            trigger={['click']}
                          >
                            <Button size="small" icon={<DownOutlined />} />
                          </Dropdown>
                        </div>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>
                    {t('No jobs available.', 'ジョブがありません。')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          current={currentPage}
          pageSize={jobsPerPage}
          total={jobDelete.length}
          onChange={(page) => setCurrentPage(page)}
          style={{ marginTop: 16, textAlign: 'right' }}
        />
      </Modal>

      <Modal
        title={`${t('Job Details', 'ジョブ詳細')}: ${selectedJob?.name}`}
        open={isJobDetailModalOpen}
        onCancel={() => setIsJobDetailModalOpen(false)}
        footer={null}
        width={1000}
      >
        {logsLoading ? (
          <div style={{ textAlign: 'center' }}>
            <Loading />
          </div>
        ) : (
          <>
            {selectedJob?.stats && (
              <div
                style={{ marginBottom: 24, padding: 16, background: '#fafafa', borderRadius: 8 }}
              >
                <h3>{t('Job Statistics', 'ジョブ統計')}</h3>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <p>
                      <strong>{t('Total Rows:', '総行数：')}</strong>
                      {selectedJob.stats.total || 0}
                    </p>
                    <p>
                      <strong>{t('Successful Rows:', '成功した行：')}</strong>
                      {selectedJob.stats.success || 0}
                    </p>
                    <p>
                      <strong>{t('Failed Rows:', '失敗した行：')}</strong>
                      {selectedJob.stats.failed || 0}
                    </p>
                  </div>
                  <div style={{ flex: 1, maxWidth: 300 }}>
                    <Pie
                      data={{
                        labels: [
                          t('Successful Rows', '成功した行'),
                          t('Failed Rows', '失敗した行'),
                        ],
                        datasets: [
                          {
                            data: [selectedJob.stats.success || 0, selectedJob.stats.failed || 0],
                            backgroundColor: ['#36A2EB', '#FF6384'],
                            borderColor: ['#36A2EB', '#FF6384'],
                            borderWidth: 1,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top',
                            labels: {
                              font: {
                                size: 14,
                              },
                            },
                          },
                          title: {
                            display: true,
                            text: t('Job Processing Results', 'ジョブ処理結果'),
                            font: {
                              size: 16,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            <Table
              columns={[
                {
                  title: t('Run Time', '実行時間'),
                  dataIndex: 'run_time',
                  key: 'run_time',
                  render: (value) =>
                    value
                      ? new Date(value).toLocaleString(language === 'ja' ? 'ja-JP' : 'en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })
                      : t('N/A', '該当なし'),
                },
                {
                  title: t('Status', '状態'),
                  dataIndex: 'status',
                  key: 'status',
                  render: (status) => (
                    <span style={{ color: status === 'Fail' ? 'red' : undefined }}>{status}</span>
                  ),
                },
                {
                  title: t('Input', '入力'),
                  dataIndex: 'source_folder',
                  key: 'source_folder',
                },
                {
                  title: t('Output', '出力'),
                  dataIndex: 'destination_folder',
                  key: 'destination_folder',
                },
                {
                  title: t('Error', 'エラー'),
                  dataIndex: 'error_message',
                  key: 'error_message',
                  render: (value) => value || t('N/A', '該当なし'),
                },
              ]}
              dataSource={jobLogs.slice((logPage - 1) * logsPerPage, logPage * logsPerPage)}
              pagination={false}
              rowKey="id"
            />
            <Pagination
              current={logPage}
              pageSize={logsPerPage}
              total={jobLogs.length}
              onChange={setLogPage}
              style={{ marginTop: 16, textAlign: 'right' }}
            />
            {jobLogs.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                {t('No logs available.', 'ログがありません。')}
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default Home;
