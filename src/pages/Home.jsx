import React, { useState, useMemo, useEffect } from 'react';
import '../styles/Home.css';
import { Table, Button, Switch, Input, Pagination, message, Dropdown, Space, Modal } from 'antd';
import {
  FileTextOutlined,
  DownloadOutlined,
  FileSearchOutlined,
  DownOutlined,
} from '@ant-design/icons';
import AddNewModal from '../components/AddNew/AddNew';
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
    if (!cronSchedule) return 'N/A';
    try {
      const [minute, hour] = cronSchedule.split(' ').map(Number);
      if (cronSchedule === '* * * * *') return '毎分 ( Every minute )';
      // Kiểm tra giá trị hợp lệ
      if (isNaN(minute) || isNaN(hour) || minute < 0 || minute > 59 || hour < 0 || hour > 23) {
        return 'Invalid Time';
      }

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const day = now.getDate();

      const vietnamDate = new Date(year, month, day, hour, minute, 0, 0);
      if (isNaN(vietnamDate.getTime())) {
        return 'Invalid Time';
      }

      const jstDate = new Date(vietnamDate.getTime() + 2 * 60 * 60 * 1000);

      const jstYear = jstDate.getFullYear();
      const jstMonth = jstDate.getMonth() + 1;
      const jstDay = jstDate.getDate();

      const formattedTime = !isNaN(jstDate.getTime())
        ? jstDate.toLocaleString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        : 'Invalid Time';

      if (isNaN(jstYear) || isNaN(jstMonth) || isNaN(jstDay) || formattedTime === 'Invalid Time') {
        return 'Invalid Time';
      }

      return `${jstYear}年${jstMonth}月${jstDay}日 ${formattedTime} JST`;
    } catch (error) {
      console.error('Error parsing cronSchedule:', error);
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

      job.forEach((jobItem) => {
        const [minute, hour] = jobItem.cron_schedule.split(' ').map(Number);
        if (nowVN.getUTCHours() === hour && nowVN.getUTCMinutes() === minute) {
          // Cập nhật trạng thái hoặc gọi API nếu cần
          // Ví dụ: setRefreshTrigger((prev) => prev + 1);
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [job]);

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
      title: 'Last Run Time',
      dataIndex: 'last_run_time',
      key: 'last_run_time',
      render: (value) =>
        value
          ? new Date(value).toLocaleString('ja-JP', {
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
            Total Job: <span className="total-job">{totalJobs}</span>
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
    </div>
  );
};

export default JobManagementSystem;
