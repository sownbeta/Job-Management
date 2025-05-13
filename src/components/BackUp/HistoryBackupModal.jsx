import React, { useState, useEffect } from 'react';
import { Modal, Table, message } from 'antd';
import { getJobs } from '../../services/jobServices';

const HistoryBackupModal = ({ visible, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  const renderJSTTime = (cronSchedule) => {
    if (!cronSchedule) return 'N/A';
    try {
      const [minute, hour] = cronSchedule.split(' ');
      const date = new Date();
      date.setUTCHours(parseInt(hour), parseInt(minute), 0, 0);
      const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000); 

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

  // Hàm convert cron thành mô tả lịch chạy
  const cronToScheduleText = (cron) => {
    if (!cron) return 'N/A';
    const parts = cron.split(' ');
    if (parts.length < 5) return 'Invalid';
    const [min, hour, dom, month, dow] = parts;

    if (min === '*' && hour === '*' && dom === '*' && month === '*' && dow === '*') {
      return 'Every minute';
    }
    if (dom === '*' && month === '*' && dow === '*') {
      return `Every day at ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
    }
    if (dom === '*' && month === '*' && dow !== '*') {
      return `Every week on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(dow, 10)]} at ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
    }
    if (dom !== '*' && month === '*' && dow === '*') {
      return `Every month on day ${dom} at ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
    }
    return cron;
  };

  const fetchHistoryData = async () => {
    try {
      setIsLoading(true);
      const response = await getJobs(); 
      setHistoryData(response || []);
    } catch (error) {
      message.error('Error fetching history data.', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchHistoryData();
    }
  }, [visible]);

  const historyColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Last Time Run',
      dataIndex: 'cron_schedule',
      key: 'time',
      render: (cronSchedule) => renderJSTTime(cronSchedule),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Folder Created',
      dataIndex: 'destination_folder',
      key: 'folder_created',
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
      title: 'Next Time Run',
      key: 'next_time_run',
      render: (_, record) => cronToScheduleText(record.cron_schedule),
    },
  ];

  return (
    <Modal title="History Backup" open={visible} onCancel={onClose} footer={null} width={'90vw'}>
      <Table
        columns={historyColumns}
        dataSource={historyData}
        pagination={{ pageSize: 5 }}
        rowKey="id"
        loading={isLoading}
      />
    </Modal>
  );
};

export default HistoryBackupModal;
