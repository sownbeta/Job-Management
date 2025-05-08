import React, { useState } from 'react';
import { Modal, Button, Input, TimePicker, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './AddNew.css';

const AddNewModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [startTime, setStartTime] = useState(dayjs('00:00', 'HH:mm'));
  const [endTime, setEndTime] = useState(dayjs('00:00', 'HH:mm'));
  const [name, setName] = useState('');

  const buttons = ['Startup', 'Hourly', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

  const showModal = () => setIsModalOpen(true);
  const handleCancel = () => setIsModalOpen(false);

  const handleClear = () => {
    setSelected(null);
    setStartTime(dayjs('00:00', 'HH:mm'));
    setEndTime(dayjs('00:00', 'HH:mm'));
    setName('');
    message.info('Form has been cleared!');
  };

  const handleSetCron = () => {
    const minute = startTime?.minute() || 0;
    const hour = startTime?.hour() || 0;
    let cron = '';

    switch (selected) {
      case 'Startup':
        cron = '@reboot';
        break;
      case 'Hourly':
        cron = `0 * * * *`;
        break;
      case 'Daily':
        cron = `${minute} ${hour} * * *`;
        break;
      case 'Weekly':
        cron = `${minute} ${hour} * * 0`;
        break;
      case 'Monthly':
        cron = `${minute} ${hour} 1 * *`;
        break;
      case 'Yearly':
        cron = `${minute} ${hour} 1 1 *`;
        break;
      default:
        cron = `${minute} ${hour} * * *`; // Mặc định chạy hàng ngày nếu không chọn gì
        break;
    }

    console.log('Generated Cron:', cron);
    console.log('Start Time:', startTime?.format('HH:mm'));
    console.log('End Time:', endTime?.format('HH:mm'));
    message.success(`Cron expression set: ${cron}`);
    setIsModalOpen(false);
  };

  const handleFileChange = (info) => {
    const file = info.file.originFileObj;
    if (file && file.type === 'text/csv') {
      console.log('Selected CSV file:', file);
      message.success(`Imported file: ${file.name}`);
    } else {
      message.error('Please select a valid CSV file');
    }
  };

  return (
    <>
      <button className='button-open-modal' type="primary" onClick={showModal}>
        Add New +
      </button>
      <Modal title="Add New" open={isModalOpen} onCancel={handleCancel} footer={null}>
        <div className="modal-container">
          <label>Name (Optional)</label>
          <Input
            placeholder="Please enter name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="option-button" style={{ marginTop: 16 }}>
            <label>Quick Schedule</label>
            <div className="add-new-button-group">
              {buttons.map((button) => (
                <Button
                  key={button}
                  type={selected === button ? 'primary' : 'default'}
                  onClick={() => setSelected(button)}
                  className="custom-button"
                >
                  {button}
                </Button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label>Start Time</label>
            <TimePicker
              format="HH:mm"
              value={startTime}
              onChange={setStartTime}
              style={{ width: '100%' }}
            />
          </div>

          <div className="upload-wrapper" style={{ marginTop: 16 }}>
            <p className="import-label">Import CSV</p>
            <Upload
              beforeUpload={() => false}
              onChange={handleFileChange}
              accept=".csv"
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>Choose CSV File</Button>
            </Upload>
          </div>

          <div className="submit-button" style={{ marginTop: 20 }}>
            <Button type="default" onClick={handleClear}>
              Clear
            </Button>
            <Button type="primary" onClick={handleSetCron} style={{ marginLeft: 8 }}>
              Set
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AddNewModal;
