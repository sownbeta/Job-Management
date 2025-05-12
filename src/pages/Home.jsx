import React, { useState, useMemo, useEffect } from 'react';
import '../styles/Home.css';
import { Table, Button, Switch, Input, Pagination, message, Dropdown, Space, Modal } from 'antd';
import {
  FileTextOutlined,
  DownloadOutlined,
  FileSearchOutlined,
  DownOutlined,
} from '@ant-design/icons';
import AddNewModal from '../components/Modal/AddNew';
import RoundedBlackButton from '../components/Button/Button';
import { deleteJob, getJobs, toggleJob } from '../services/jobServices';
import Loading from '../components/Loading/Loading';
import HistoryBackupModal from '../components/Backup/HistoryBackupModal';

const JobManagementSystem = () => {
  const [job, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editJobData, setEditJobData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const jobsPerPage = 7;

  const updatedJobs = async () => {
    try {
      setIsLoading(true);
      const response = await getJobs();
      if (response) {
        setJobs(response || []);
        return response;
      }
    } catch (error) {
      message.error('Error loading to-do list.', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    updatedJobs();
  }, [refreshTrigger]);

  const renderJSTTime = (cronSchedule) => {
    if (!cronSchedule) return 'N/A'; // Handle null or undefined time
    try {
      const [minute, hour] = cronSchedule.split(' ');
      const date = new Date();
      date.setUTCHours(parseInt(hour), parseInt(minute), 0, 0);
      const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000); // Convert to JST (UTC+9)

      const year = jstDate.getFullYear();
      const month = jstDate.getMonth() + 1;
      const day = jstDate.getDate();

      const formattedTime = jstDate.toLocaleString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      return `${year}年${month}月${day}日 ${formattedTime} JST`;
    } catch {
      return 'Invalid Time';
    }
  };

  const getDropdownItems = (record) => [
    {
      key: 'edit',
      label: 'Edit Job',
      onClick: () => setEditJobData(record),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: 'Delete Job',
      onClick: () => handleDelete(record.id),
    },
  ];

  const handleDelete = (id) => {
    Modal.confirm({
      title: `Are you sure you want to delete job ${id}?`,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      async onOk() {
        try {
          setIsLoading(true);
          await deleteJob(id);
          setRefreshTrigger((prev) => prev + 1);
          message.success('Job deleted successfully!');
        } catch (error) {
          message.error('Error deleting job.', error);
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
      message.success('Job status updated successfully!');
    } catch (error) {
      console.error('Error updating job status:', error);
      message.error('Error updating job status.', error);
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

  const jobArray = useMemo(() => Object.values(job), [job]);

  const filteredJobs = useMemo(() => {
    return jobArray.filter(
      (job) =>
        job.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.job?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [jobArray, searchTerm]);

  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * jobsPerPage;
    return filteredJobs.slice(startIndex, startIndex + jobsPerPage);
  }, [filteredJobs, currentPage]);

  const totalJobs = filteredJobs.length;

  const columns = [
    {
      title: '#',
      key: 'id',
      dataIndex: 'id',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <span className={`status ${status?.toLowerCase()}`}>{status}</span>,
    },
    {
      title: 'Time (JST)',
      dataIndex: 'cron_schedule',
      key: 'time',
      render: (cronSchedule) => renderJSTTime(cronSchedule),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Switch checked={record?.is_active} onChange={() => toggleJobStatus(record?.id)} />
          <Dropdown menu={{ items: getDropdownItems(record) }}>
            <a onClick={(e) => e.preventDefault()}>
              <Space>
                More
                <DownOutlined />
              </Space>
            </a>
          </Dropdown>
        </div>
      ),
    },
  ];

  return isLoading ? (
    <Loading />
  ) : (
    <div className="container">
      <div className="header">
        Job Management System
        <div className="button-group">
          <AddNewModal
            setIsLoading={setIsLoading}
            refreshJobs={() => setRefreshTrigger((prev) => prev + 1)}
            editingJob={editJobData}
            onClose={() => setEditJobData(null)}
            onJobUpdated={handleJobUpdated}
          />
          <RoundedBlackButton onClick={() => console.log('Backup')}>
            <FileTextOutlined /> Backup
          </RoundedBlackButton>
          <RoundedBlackButton onClick={() => console.log('Export')}>
            <DownloadOutlined /> Export
          </RoundedBlackButton>
          <button className="history-button" onClick={handleHistoryButtonClick}>
            <FileTextOutlined /> History Backup
          </button>
        </div>
      </div>

      <div className="table-container">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
          <Input
            placeholder="Search jobs"
            prefix={<FileSearchOutlined />}
            style={{ width: 200 }}
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
          <div>Total Job: {totalJobs}</div>
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
    </div>
  );
};

export default JobManagementSystem;
