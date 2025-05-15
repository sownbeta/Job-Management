import React, { useState, useMemo, useEffect } from 'react';
import '../styles/Home.css';
import { Table, Button, Switch, Input, Pagination, message, Dropdown, Space, Modal, Menu } from 'antd';
import {
  FileTextOutlined,
  DownloadOutlined,
  FileSearchOutlined,
  DownOutlined,
  EllipsisOutlined,
} from '@ant-design/icons';
import AddNewModal from '../components/AddNew/AddNew';
import RoundedBlackButton from '../components/Button/Button';
import {
  deleteJob,
  deleteJobForever,
  getJobDelete,
  getJobs,
  restoreJob,
  toggleJob,
} from '../services/jobServices';
import Loading from '../components/Loading/Loading';
import HistoryBackupModal from '../components/Backup/HistoryBackupModal';
import { Switch as AntdSwitch } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { renderJSTTime } from '../utils/timeUtils';

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
      label: t('Edit Job', '編集'),
      onClick: () => setEditJobData(record),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: t('Delete Job', '消去'),
      onClick: () => handleDelete(record.id),
    },
  ];

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
          // Ví dụ: setRefreshTrigger((prev) => prev + 1);
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
      title: t('Time (JST)', '実行時刻 (JST)'),
      dataIndex: 'cron_schedule',
      key: 'time',
      // render ra định dạng thời gian JST
      render: (cronSchedule) => renderJSTTime(cronSchedule),
    },
    {
      title: t('Action', '操作'),
      key: 'action',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Switch checked={record?.is_active} onChange={() => toggleJobStatus(record?.id)} />
          <Dropdown menu={{ items: getDropdownItems(record) }}>
            <a onClick={(e) => e.preventDefault()}>
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
          const response = deleteJobForever(jobId);
          if (response) {
            message.success('Job deleted successfully!');
          }
        } catch (error) {
          console.error('Error deleting job:', error);
        } finally {
          setIsLoading(false);
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
            showSizeChanger={false}
          />
        </div>
      </div>

      <HistoryBackupModal
        visible={isHistoryModalVisible}
        onClose={() => setIsHistoryModalVisible(false)}
      />

      <Modal
        title="Backup Job"
        open={isBackupModalOpen}
        onCancel={closeBackupModal}
        footer={null}
        width="80vw"
      >
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{language === 'en' ? 'Name' : '名前'}</th>
                <th>{language === 'en' ? 'Cron Schedule' : 'スケジュール'}</th>
                <th>{language === 'en' ? 'Last Run' : 'ラストラン'}</th>
                <th>{language === 'en' ? 'Status' : '状態'}</th>
                <th>{language === 'en' ? 'Action' : 'アクション'}</th>
              </tr>
            </thead>
            <tbody>
              {jobDelete?.length > 0 ? (
                jobDelete.map((job) => (
                  <tr key={job.id}>
                    <td>{job.id}</td>
                    <td>{job.name}</td>
                    <td>{job.cron_schedule}</td>
                    <td>{job.last_run_time}</td>
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
                            <Menu>
                              <Menu.Item key="restore" onClick={() => handleRestore(job?.id)}>
                                {language === 'en' ? 'Restore' : '復元する'}
                              </Menu.Item>
                              <Menu.Item key="delete" onClick={() => handleDeleteForever(job?.id)}>
                                {language === 'en' ? 'Delete' : '削除'}
                              </Menu.Item>
                            </Menu>
                          }
                          trigger={['click']}
                        >
                          <Button size="small" icon={<EllipsisOutlined />} />
                        </Dropdown>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>
                    No jobs available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
};

export default JobManagementSystem;
