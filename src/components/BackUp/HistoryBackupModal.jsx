import React, { useState, useEffect } from 'react';
import { Modal, Table, message } from 'antd';
import { useSelector } from 'react-redux';
import { getJobs } from '../../services/jobServices';
import { renderJSTTime } from '../../utils/timeUtils';

const HistoryBackupModal = ({ visible, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const language = useSelector((state) => state.language);
  const t = (en, ja) => (language === 'ja' ? ja : en);

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
      message.error(t('Error fetching history data.', '履歴データの取得エラー'));
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
      title: t('Last Time Run', '前回実行時刻'),
      dataIndex: 'cron_schedule',
      key: 'time',
      render: (cronSchedule) => renderJSTTime(cronSchedule),
    },
    {
      title: t('Status', 'ステータス'),
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: t('Folder Created', '作成フォルダ'),
      dataIndex: 'destination_folder',
      key: 'folder_created',
    },
    {
      title: t('Last Run Time', '最終実行時刻'),
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
      title: t('Next Time Run', '次回実行予定'),
      key: 'next_time_run',
      render: (_, record) => cronToScheduleText(record.cron_schedule),
    },
  ];

  return (
    <Modal
      title={t('History Backup', 'バックアップ履歴')}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={'90vw'}
    >
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
