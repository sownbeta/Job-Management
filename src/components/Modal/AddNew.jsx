import React, { useEffect, useState } from 'react';
import { Button, DatePicker, Form, Input, message, Modal, Upload, Radio, Select } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { uploadFile, updateJob } from '../../services/jobServices';
import moment from 'moment';
import 'moment-timezone';
import cronstrue from 'cronstrue';
import './AddNew.css';
import RoundedBlackButton from '../Button/Button';

const { Option } = Select;

const AddNewModal = ({ editingJob, onClose, refreshJobs }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [scheduleType, setScheduleType] = useState('daily');
  const [cronPreview, setCronPreview] = useState('');
  const [selectedHour, setSelectedHour] = useState('0');
  const [selectedMinute, setSelectedMinute] = useState('0');

  useEffect(() => {
    if (editingJob) {
      setIsModalOpen(true);
      const scheduleType = editingJob.cron_schedule?.includes('?') ? 'custom' : 'daily';
      form.setFieldsValue({
        name: editingJob.name,
        cron_schedule: editingJob.cron_schedule ? moment(editingJob.cron_schedule) : moment(),
        source_folder: editingJob.source_folder,
        destination_folder: editingJob.destination_folder,
        schedule_type: scheduleType,
        custom_cron: editingJob.cron_schedule,
        day_of_week: editingJob.day_of_week,
        day_of_month: editingJob.day_of_month,
      });
      setScheduleType(scheduleType);
      updateCronPreview(editingJob.cron_schedule || '');
    }
  }, [editingJob, form]);

  const handleFileChange = (file) => {
    if (file.type !== 'text/csv') {
      message.error('Only CSV files are allowed.');
      return false;
    }
    setUploadedFile(file);
    return false;
  };

  const handleScheduleTypeChange = (e) => {
    const value = e.target.value;
    setScheduleType(value);
    if (value !== 'custom') {
      const cron_schedule = form.getFieldValue('cron_schedule');
      if (cron_schedule) {
        const cron = generateCron(
          cron_schedule,
          value,
          form.getFieldValue('day_of_week'),
          form.getFieldValue('day_of_month')
        );
        updateCronPreview(cron);
      }
    }
  };

  const updateCronPreview = (cron) => {
    try {
      const description = cronstrue.toString(cron, { throwExceptionOnParseError: true });
      setCronPreview(description);
    } catch {
      setCronPreview('Invalid cron expression');
    }
  };

  const generateCron = (date, type, dayOfWeek, dayOfMonth) => {
    if (type === 'custom') return form.getFieldValue('custom_cron') || '0 0 * * *';
    if (!date) return '';
    const minute = date.minute();
    const hour = date.hour();
    if (type === 'run_once') {
      const day = date.date();
      const month = date.month() + 1;
      const year = date.year();
      return `${minute} ${hour} ${day} ${month} ? ${year}`;
    }
    if (type === 'daily') {
      return `${minute} ${hour} * * *`;
    }
    if (type === 'weekly') {
      return `${minute} ${hour} * * ${dayOfWeek || '*'}`;
    }
    if (type === 'monthly') {
      return `${minute} ${hour} ${dayOfMonth || 1} * *`;
    }
    return '';
  };

  const generateCronFromSelect = (hour, minute, type, dayOfWeek, dayOfMonth) => {
    if (type === 'custom') return form.getFieldValue('custom_cron') || '0 0 * * *';
    if (type === 'run_once') {
      // Lấy ngày và tháng từ trường cron_schedule nếu là moment, nếu không thì dùng ngày hiện tại
      const cronScheduleValue = form.getFieldValue('cron_schedule');
      let day = 1,
        month = 1;
      if (
        cronScheduleValue &&
        typeof cronScheduleValue === 'object' &&
        typeof cronScheduleValue.date === 'function'
      ) {
        day = cronScheduleValue.date();
        month = cronScheduleValue.month() + 1;
      } else {
        const now = new Date();
        day = now.getDate();
        month = now.getMonth() + 1;
      }
      return `${minute} ${hour} ${day} ${month} *`;
    }
    if (type === 'daily') {
      return `${minute} ${hour} * * *`;
    }
    if (type === 'weekly') {
      return `${minute} ${hour} * * ${dayOfWeek || '*'}`;
    }
    if (type === 'monthly') {
      return `${minute} ${hour} ${dayOfMonth || 1} * *`;
    }
    return '0 0 * * *';
  };

  const handleHourChange = (e) => {
    setSelectedHour(e.target.value);
    if (scheduleType !== 'custom') {
      const cron = generateCronFromSelect(
        e.target.value,
        selectedMinute,
        scheduleType,
        form.getFieldValue('day_of_week'),
        form.getFieldValue('day_of_month')
      );
      updateCronPreview(cron);
    }
  };

  const handleMinuteChange = (e) => {
    setSelectedMinute(e.target.value);
    if (scheduleType !== 'custom') {
      const cron = generateCronFromSelect(
        selectedHour,
        e.target.value,
        scheduleType,
        form.getFieldValue('day_of_week'),
        form.getFieldValue('day_of_month')
      );
      updateCronPreview(cron);
    }
  };

  const handleCronScheduleChange = (date) => {
    console.log('Selected date:', date);

    if (date && scheduleType !== 'custom') {
      const cron = generateCron(
        date,
        scheduleType,
        form.getFieldValue('day_of_week'),
        form.getFieldValue('day_of_month')
      );
      updateCronPreview(cron);
    }
  };

  const handleCustomCronChange = (e) => {
    const cron = e.target.value;
    updateCronPreview(cron);
  };

  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      let cron_schedule;
      if (scheduleType === 'custom') {
        cron_schedule = values.custom_cron;
      } else {
        cron_schedule = generateCronFromSelect(
          selectedHour,
          selectedMinute,
          scheduleType,
          values.day_of_week,
          values.day_of_month
        );
      }

      if (editingJob) {
        // Update existing job
        const updates = {
          name: values.name,
          cron_schedule,
          source_folder: values.source_folder,
          destination_folder: values.destination_folder,
          day_of_week: values.day_of_week,
          day_of_month: values.day_of_month,
        };
        await updateJob(editingJob.id, updates);
        message.success('Job updated successfully!');
      } else {
        // Create new job
        if (!uploadedFile) {
          message.error('Please select a CSV file.');
          return;
        }
        const formData = new FormData();
        formData.append('job_name', values.name);
        formData.append('cron_schedule', cron_schedule);
        formData.append('file', uploadedFile);
        formData.append('source_folder', values.source_folder || '');
        formData.append('destination_folder', values.destination_folder || '');
        if (values.day_of_week) formData.append('day_of_week', values.day_of_week);
        if (values.day_of_month) formData.append('day_of_month', values.day_of_month);
        formData.append('is_active', 'true'); // Thêm dòng này để job tự động chạy sau khi tạo
        await uploadFile(formData);
        message.success('Job created and file uploaded successfully!');
      }
      handleCancel(); // Ensure modal is closed after submission
      if (refreshJobs) refreshJobs();
    } catch (error) {
      console.error('Error:', error);
      message.error('Operation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setUploadedFile(null);
    setScheduleType('daily');
    setCronPreview('');
    if (onClose) onClose();
  };

  return (
    <>
      {!editingJob && (
        <RoundedBlackButton type="primary" onClick={() => setIsModalOpen(true)}>
          Add New +
        </RoundedBlackButton>
      )}
      <Modal
        title={editingJob ? 'Edit Job' : 'Add New Job'}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            schedule_type: 'daily',
            cron_schedule: moment().tz('Asia/Ho_Chi_Minh'),
          }}
        >
          <Form.Item
            label="Job Name"
            name="name"
            rules={[{ required: true, message: 'Please enter the job name' }]}
          >
            <Input placeholder="Enter job name" />
          </Form.Item>
          <Form.Item
            label="Schedule Type"
            name="schedule_type"
            rules={[{ required: true, message: 'Please select a schedule type' }]}
          >
            <Radio.Group onChange={handleScheduleTypeChange}>
              <Radio value="run_once">Run Once</Radio>
              <Radio value="daily">Daily</Radio>
              <Radio value="weekly">Weekly</Radio>
              <Radio value="monthly">Monthly</Radio>
              <Radio value="custom">Custom</Radio>
            </Radio.Group>
          </Form.Item>
          {scheduleType === 'weekly' && (
            <Form.Item
              label="Day of Week"
              name="day_of_week"
              rules={[{ required: true, message: 'Please select a day of the week' }]}
            >
              <Select placeholder="Select day of week">
                <Option value="0">Sunday</Option>
                <Option value="1">Monday</Option>
                <Option value="2">Tuesday</Option>
                <Option value="3">Wednesday</Option>
                <Option value="4">Thursday</Option>
                <Option value="5">Friday</Option>
                <Option value="6">Saturday</Option>
              </Select>
            </Form.Item>
          )}
          {scheduleType === 'monthly' && (
            <Form.Item
              label="Day of Month"
              name="day_of_month"
              rules={[{ required: true, message: 'Please select a day of the month' }]}
            >
              <Select placeholder="Select day of month">
                {Array.from({ length: 31 }, (_, i) => (
                  <Option key={i + 1} value={String(i + 1)}>
                    {i + 1}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
          {scheduleType !== 'custom' && (
            <Form.Item
              label="Cron Schedule"
              name="cron_schedule"
              rules={[{ required: true, message: 'Please select a cron schedule' }]}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <label>Hour:</label>
                <select value={selectedHour} onChange={handleHourChange}>
                  {[...Array(24).keys()].map((h) => (
                    <option key={h} value={h}>
                      {h.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <label>Minute:</label>
                <select value={selectedMinute} onChange={handleMinuteChange}>
                  {[...Array(60).keys()].map((m) => (
                    <option key={m} value={m}>
                      {m.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </Form.Item>
          )}
          {scheduleType === 'custom' && (
            <Form.Item
              label="Custom Cron Expression"
              name="custom_cron"
              rules={[{ required: true, message: 'Please enter a cron expression' }]}
            >
              <Input
                placeholder="Enter cron expression (e.g., 0 0 12 * * ?)"
                onChange={handleCustomCronChange}
              />
            </Form.Item>
          )}
          {cronPreview && (
            <Form.Item label="Schedule Preview">
              <p style={{ color: cronPreview.includes('Invalid') ? 'red' : 'green' }}>
                {cronPreview}
              </p>
            </Form.Item>
          )}
          {!editingJob && (
            <Form.Item
              label="Source File"
              name="source_file"
              rules={[{ required: true, message: 'Please select a source file' }]}
            >
              <Upload beforeUpload={handleFileChange} showUploadList={false}>
                <Button icon={<UploadOutlined />}>Select File</Button>
              </Upload>
              {uploadedFile && <p>Selected File: {uploadedFile.name}</p>}
            </Form.Item>
          )}
          <Form.Item>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={isLoading} style={{ marginLeft: 8 }}>
              {editingJob ? 'Update Job' : 'Create'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AddNewModal;
