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

  const fetchHistoryData = async () => {
    try {
      setIsLoading(true);
      const response = await getJobs(); // Replace with actual API for history
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
      title: 'Schedule',
      dataIndex: 'schedule',
      key: 'schedule',
    },
  ];

  return (
    <Modal title="History Backup" visible={visible} onCancel={onClose} footer={null} width={"80vw"}>
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
