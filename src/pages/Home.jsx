import React, { useState, useMemo, useEffect } from 'react';
import { Table, Button, Switch, Input, Pagination, message, dr } from 'antd';
import { FileTextOutlined, DownloadOutlined, FileSearchOutlined } from '@ant-design/icons';
import AddNew from '../components/Modal/AddNew';
import RoundedBlackButton from '../components/Button/Button';
import '../styles/Home.css';
import { getJobs } from '../services/jobServices';
import { toggleJob } from '../services/jobServices';

const JobManagementSystem = () => {
  const [jobsObj, setJobsObj] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 7;

  const updatedJobs = async () => {
    try {
      const response = await getJobs();
      if (response) {
        setJobsObj(response || []);
        return response;
      }
    } catch (error) {
      message.error('Lỗi khi tải danh sách công việc.', error);
    }
  };
  const handleDelete = (id) => {
    Modal.confirm({
      title: `Are you sure you want to delete job ${id}?`,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      async onOk() {
        setIsLoading(true);
        try {
          await deleteJobs(id);
          setJobs((prev) => prev.filter((job) => job.id !== id));
          updatedJobs();
          message.success('Job deleted successfully!');
        } catch (error) {
          message.error('Error deleting job.', error);
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await updatedJobs();
        if (response && typeof response === 'object') {
          setJobsObj(response);
        } else {
          setJobsObj({});
        }
      } catch (error) {
        message.error('Lỗi khi tải danh sách công việc.', error);
      }
    };
    fetchJobs();
  }, []);

  console.log('Jobs Object:', jobsObj);

  const jobArray = useMemo(() => Object.values(jobsObj), [jobsObj]);

  const filteredJobs = useMemo(() => {
    return jobArray.filter(
      (job) =>
        job.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.job?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [jobArray, searchTerm]);

  // Paginated jobs
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * jobsPerPage;
    return filteredJobs.slice(startIndex, startIndex + jobsPerPage);
  }, [filteredJobs, currentPage]);

  const totalJobs = filteredJobs.length;

  const toggleJobStatus = async (id) => {
    try {
      setIsLoading(true);
      await toggleJob(id);
      setJobsObj((prevJobs) =>
        prevJobs.map((job) => (job.id === id ? { ...job, is_active: !job.is_active } : job))
      );
      updatedJobs();
      message.success('Job status updated successfully!');
    } catch (error) {
      console.error('Error updating job status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    {
      title: '#',
      key: 'id',
      dataIndex: 'id', // Use the database id directly
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
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Switch checked={record?.is_active} onChange={() => toggleJobStatus(record?.id)} />
        </div>
      ),
    },
  ];

  return (
    <div className="container">
      <div className="header">
        Job Management System
        <div className="button-group">
          <AddNew />
          <RoundedBlackButton onClick={() => console.log('Backup')}>
            <FileTextOutlined /> Backup
          </RoundedBlackButton>

          <RoundedBlackButton onClick={() => console.log('Export')}>
            <DownloadOutlined /> Export
          </RoundedBlackButton>
          <button className="history-button">
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
    </div>
  );
};

export default JobManagementSystem;
