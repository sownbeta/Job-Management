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
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AddNewModal from '../components/AddNew/AddNew';
import HistoryBackupModal from '../components/Backup/HistoryBackupModal';
import RoundedBlackButton from '../components/Button/Button';
import Loading from '../components/Loading/Loading';
import {
  deleteJob,
  deleteJobForever,
  getJobDelete,
  getJobs,
  restoreJob,
  toggleJob,
} from '../services/jobServices';
import '../styles/Home.css';

const JobManagementSystem = () => {
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
  const language = useSelector((state) => state.language);
  const dispatch = useDispatch();

  const handleLanguageSwitch = (checked) => {
    dispatch({ type: 'SET_LANGUAGE', payload: checked ? 'ja' : 'en' });
  };

  const t = (en, ja) => (language === 'ja' ? ja : en);

  const updatedJobs = async () => {
    try {
      setIsLoading(true);
      const response = await getJobs();
      if (response) {
        setJobs(response || []);
        return response;
      }
    } catch (error) {
      message.error(t('Error loading to-do list.', 'ジョブリストの読み込みエラー'));
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    updatedJobs();
  }, [refreshTrigger]);

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
  console.log('2', selectedJob);

  const handleDelete = (id) => {
    Modal.confirm({
      title: t(
        `Are you sure you want to delete job ${id}?`,
        `ジョブ ${id} を削除してもよろしいですか？`
      ),
      content: t('This action cannot be undone.', 'この操作は元に戻せません。'),
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
      await toggleJob(id);
      setRefreshTrigger((prev) => prev + 1);
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
      console.error('Error fetching job history:', error);
    }
  };

  const closeBackupModal = () => {
    setIsBackupModalOpen(false);
    setJobDelete([]);
  };

  const handleRowClick = (record, event) => {
    if (
      event.target.closest('.ant-switch') ||
      event.target.closest('.ant-dropdown-trigger') ||
      event.target.closest('button')
    ) {
      return;
    }
    setSelectedJob(record);
    setIsJobDetailModalOpen(true);
  };

  const jobArray = useMemo(() => Object.values(jobs), [jobs]);

  const filteredJobs = useMemo(() => {
    return jobArray.filter((job) => job.name?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [jobArray, searchTerm]);

  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * jobsPerPage;
    return filteredJobs.slice(startIndex, startIndex + jobsPerPage);
  }, [filteredJobs, currentPage]);

  const totalJobs = filteredJobs.length;

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const nowVN = new Date(now.getTime() + 7 * 60 * 60 * 1000);

      jobs.forEach((jobItem) => {
        const [minute, hour] = jobItem.cron_schedule.split(' ').map(Number);
        if (nowVN.getUTCHours() === hour && nowVN.getUTCMinutes() === minute) {
          // Cập nhật trạng thái hoặc gọi API nếu cần
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [jobs]);

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
      render: (status) => <span className={`status ${status?.toLowerCase()}`}>{status}</span>,
    },
    {
      title: t('Schedule Job', '実行時刻 (JST)'),
      dataIndex: 'cron_schedule',
      key: 'time',
    },
    {
      title: t('Last Time Run', 'ステータス'),
      dataIndex: 'last_run_time',
      key: 'last_run_time',
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

  const handleRestore = async (jobId) => {
    try {
      const response = await restoreJob(jobId);
      if (response) {
        message.success(
          language === 'en' ? 'Job restored successfully!' : 'ジョブが正常に復元されました!'
        );
        setRefreshTrigger((prev) => prev + 1); // Refresh data
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      closeBackupModal();
    }
  };

  const handleDeleteForever = async (jobId) => {
    Modal.confirm({
      title: `Are you sure you want to delete job ${jobId}?`,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      async onOk() {
        setIsLoading(true);
        try {
          const response = await deleteJobForever(jobId);
          if (response) {
            message.success('Job deleted successfully!');
            setRefreshTrigger((prev) => prev + 1); // Refresh data
          }
        } catch (error) {
          console.error('Error deleting job:', error);
        } finally {
          setIsLoading(false);
          closeBackupModal();
        }
      },
    });
  };

  return isLoading ? (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <Loading />
    </div>
  ) : (
    <div className="container">
      <div className="header">
        {t('Job Management System', 'ジョブ管理システム')}
        <div className="button-group">
          <AntdSwitch
            checkedChildren="日本語"
            unCheckedChildren="English"
            checked={language === 'ja'}
            onChange={handleLanguageSwitch}
            style={{ marginRight: 16, marginTop: '5px' }}
          />
          <AddNewModal
            setIsLoading={setIsLoading}
            refreshJobs={() => setRefreshTrigger((prev) => prev + 1)}
            editingJob={editJobData}
            onClose={() => setEditJobData(null)}
            onJobUpdated={handleJobUpdated}
          />

          <RoundedBlackButton type="default" onClick={openBackupModal}>
            {t('🗑️Bin', '🗑️ビン')}
          </RoundedBlackButton>
          <button className="history-button" onClick={handleHistoryButtonClick}>
            <FileTextOutlined /> {t('Jobs History', 'バックアップ履歴')}
          </button>
        </div>
      </div>

      <div className="table-container">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
          <Input
            placeholder={t('Search jobs', 'ジョブ検索')}
            prefix={<FileSearchOutlined />}
            style={{ width: 300 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
        width={800} // Tăng kích thước modal bin
      >
        <Table
          dataSource={jobDelete}
          columns={[
            {
              title: t('ID', 'ID'),
              dataIndex: 'id',
              key: 'id',
            },
            {
              title: t('Name', '名前'),
              dataIndex: 'name',
              key: 'name',
            },
            {
              title: t('Action', '操作'),
              key: 'actions',
              render: (_, record) => (
                <Space>
                  <Button type="primary" onClick={() => handleRestore(record.id)}>
                    {t('Restore', '復元')}
                  </Button>
                  <Button danger onClick={() => handleDeleteForever(record.id)}>
                    {t('Delete Forever', '完全に削除')}
                  </Button>
                </Space>
              ),
            },
          ]}
          rowKey="id"
          scroll={{ y: 300 }}
        />
      </Modal>

      <Modal
        title={t('Job Details', 'ジョブ詳細')}
        open={isJobDetailModalOpen}
        onCancel={() => setIsJobDetailModalOpen(false)}
        footer={null}
        width={600} // Tăng kích thước modal
      >
        {selectedJob && (
          <div>
            <p>
              <b>ID:</b> {selectedJob.id}
            </p>
            <p>
              <b>{t('Name', '名前')}:</b> {selectedJob.name}
            </p>
            <p>
              <b>{t('Status', 'ステータス')}:</b> {selectedJob.status}
            </p>
            <p>
              <b>{t('Schedule Job', '実行時刻 (JST)')}:</b> {selectedJob.cron_schedule}
            </p>
            {/* Hiển thị stats nếu có */}
            {selectedJob.stats && selectedJob.stats.details && (
              <div style={{ marginTop: 24 }}>
                <h3>{t('Job Stats', 'ジョブ統計')}</h3>
                <ul style={{ fontSize: 16 }}>
                  <li>
                    <b>{t('Success', '成功')}:</b> {selectedJob.stats.success}
                  </li>
                  <li>
                    <b>{t('Failed', '失敗')}:</b> {selectedJob.stats.failed}
                  </li>
                  <li>
                    <b>{t('Total', '合計')}:</b> {selectedJob.stats.total}
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default JobManagementSystem;
