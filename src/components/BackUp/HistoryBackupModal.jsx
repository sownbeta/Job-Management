import React, { useState, useEffect } from 'react';
import { Modal, Table, Tooltip } from 'antd';
import { useSelector } from 'react-redux';
import { fetchJobHistory } from '../../services/jobServices';
import { formatToJST } from '../../utils/helper';

const HistoryBackupModal = ({ visible, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const language = useSelector((state) => state.language);
  const t = (en, ja) => (language === 'ja' ? ja : en);

  const fetchHistoryData = async () => {
    try {
      setIsLoading(true);
      const response = await fetchJobHistory();
      setHistoryData(response || []);
    } catch (error) {
      console.log(error);
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
      title: t('Job ID', 'ジョブID'),
      dataIndex: 'job_id',
      key: 'job_id',
      width: 100,
    },
    {
      title: t('Name', '名前'),
      dataIndex: ['job', 'name'],
      key: 'job_name',
      width: 150,
    },
    {
      title: t('Status', '状態'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (text, record) =>
        record.error_message && text === 'Fail' ? (
          <Tooltip title={record.error_message}>
            <span style={{ color: 'red' }}>{text}</span>
          </Tooltip>
        ) : (
          text
        ),
    },
    {
      title: t('Source Folder', 'ソースフォルダ'),
      dataIndex: 'source_folder',
      key: 'source_folder',
      width: 200,
    },
    {
      title: t('Destination Folder', '出力フォルダ'),
      dataIndex: 'destination_folder',
      key: 'destination_folder',
      width: 200,
    },
    {
      title: t('Run Time', '実行時間'),
      dataIndex: 'run_time',
      key: 'run_time',
      width: 200,
      render: (text) => formatToJST(text),
    },
  ];

  return (
    <Modal
      title={t('Job History', 'ジョブ履歴')}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={'80vw'}
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
