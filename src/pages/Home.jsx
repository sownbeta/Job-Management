import React, { useState, useMemo } from 'react';
import { Table, Button, Switch, Input, Pagination } from 'antd';
import {
  PlusOutlined,
  FileTextOutlined,
  UploadOutlined,
  DownloadOutlined,
  FileSyncOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import AddNew from '../components/Modal/AddNew';
import '../styles/Home.css';

const JobManagementSystem = () => {
  const [jobs, setJobs] = useState([
    {
      id: 1,
      name: 'Daily CSV Sync',
      job: 'Daily CSV Sync',
      status: 'Success',
      time: '2025-04-23 10:00:00',
      enabled: true,
    },
    {
      id: 2,
      name: 'Hourly Import Job',
      job: 'Hourly Import Job',
      status: 'Fail',
      time: '2025-04-23 10:00:00',
      enabled: false,
    },
    {
      id: 3,
      name: 'Weekly Backup',
      job: 'Weekly Backup',
      status: 'Running',
      time: '2025-04-23 10:00:00',
      enabled: true,
    },
    {
      id: 4,
      name: 'CSV Merge Append',
      job: 'CSV Merge Append',
      status: 'Success',
      time: '2025-04-23 10:00:00',
      enabled: true,
    },
    {
      id: 5,
      name: 'CSV Merge Append',
      job: 'CSV Merge Append',
      status: 'Success',
      time: '2025-04-23 10:00:00',
      enabled: true,
    },
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 4;

  // Sử dụng useMemo để lọc dữ liệu
  const filteredJobs = useMemo(() => {
    console.log('Filtering jobs...');
    return jobs.filter(
      (job) =>
        job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.job.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [jobs, searchTerm]);

  // Sử dụng useMemo để phân trang dữ liệu
  const paginatedJobs = useMemo(() => {
    console.log('Paginating jobs...');
    const startIndex = (currentPage - 1) * jobsPerPage;
    return filteredJobs.slice(startIndex, startIndex + jobsPerPage);
  }, [filteredJobs, currentPage]);

  const totalJobs = filteredJobs.length;

  const handleToggle = (id) => {
    setJobs(jobs.map((job) => (job.id === id ? { ...job, enabled: !job.enabled } : job)));
  };

  const columns = [
    {
      title: '#',
      key: 'index',
      render: (_, __, index) => (currentPage - 1) * jobsPerPage + index + 1,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Job',
      dataIndex: 'job',
      key: 'job',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <span className={`status ${status.toLowerCase()}`}>{status}</span>,
    },
    {
      title: 'Time (JST)',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Switch checked={record.enabled} onChange={() => handleToggle(record.id)} />
          <span>⋮</span>
        </div>
      ),
    },
  ];

  return (
    <div className="container">
      <div className="header">
        Job Management System
        <button className="history-button">
          <FileTextOutlined /> History Backup
        </button>
      </div>

      <div className="environment-section">
        <label className="label">Environment Variables</label>
        <Input placeholder="# please path here" />
      </div>

      <div className="button-group">
        <AddNew />
        <Button type="primary" icon={<FileTextOutlined />}>
          Backup
        </Button>
        <Button type="primary" icon={<UploadOutlined />}>
          Import
        </Button>
        <Button type="primary" icon={<DownloadOutlined />}>
          Export
        </Button>
        <Button type="primary" icon={<FileSyncOutlined />}>
          Get From Crontab
        </Button>
        <Button type="primary" icon={<FileSyncOutlined />}>
          Get From Crontab
        </Button>
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

        <Table columns={columns} dataSource={paginatedJobs} pagination={false} rowKey="id" />

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
