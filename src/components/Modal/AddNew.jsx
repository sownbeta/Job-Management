import  { useState } from 'react';
import { Modal, Button, Input, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './AddNew.css';
import { uploadFile } from '../../services/jobServices';
import {dateToCronb } from '../../util/helper';

const AddNewModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState({
    name: '',
    startDate: new Date().getTime(),
  });
  const showModal = () => setIsModalOpen(true);
  const handleCancel = () => {
    setIsModalOpen(false);
    handleClear();
  };

  const handleClear = () => {
    setUploadedFile(null);
    setData({ name: '', startDate: new Date().getTime() });
    message.info('Form has been cleared!');
  };

  const handleFileChange = (file) => {
    if (file.type !== 'text/csv') {
      message.error('Only CSV files are allowed.');
      return false;
    }
    setUploadedFile(file);
    message.success(`Selected file: ${file.name}`);
    return false; 
  };



  const handleSubmit = async () => {
    if (!uploadedFile) {
      message.error('Please select a CSV file.');
      return;
    }
    if (!data.name) {
      message.error('Please enter input name.');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('job_name', data.name);
      formData.append('cron_schedule', dateToCronb(data.startDate));
      formData.append('file', uploadedFile);

      const response = await uploadFile(formData);
      if (response) {
        message.success('Job created and file uploaded successfully!');
        handleCancel(); 
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error('File upload failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button className="button-open-modal" type="primary" onClick={showModal}>
        Add New +
      </button>
      <Modal title="Add New Job" open={isModalOpen} onCancel={handleCancel} footer={null}>
        <div className="modal-container">
          <label>Job Name</label>
          <Input
            placeholder="Enter job name"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
          />
          <div style={{ marginTop: 16 }}>
            <label>Cron Schedule</label>
            <input
              min={new Date().toISOString().slice(0, 16)}
              type="datetime-local"
              value={data.startDate ? dayjs(data.startDate).format('YYYY-MM-DDTHH:mm') : ''}
              onChange={(e) => {
                const value = dayjs(e.target.value).valueOf();
                setData({ ...data, startDate: value });
              }}
              style={{ width: '100%', marginTop: 8 }}
            />
          </div>

          <div className="upload-wrapper" style={{ marginTop: 16 }}>
            <p className="import-label">Import CSV</p>
            <Upload beforeUpload={handleFileChange} accept=".csv" showUploadList={false}>
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
            {uploadedFile && <p>Selected File: {uploadedFile.name}</p>}
          </div>

          <div className="submit-button" style={{ marginTop: 20 }}>
            <Button type="default" onClick={handleClear}>
              Clear
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={isLoading}
              style={{ marginLeft: 8 }}
            >
              Create Job
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AddNewModal;
