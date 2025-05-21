import React, { useEffect, useState } from 'react';
import { Button, TimePicker, Form, Input, message, Modal, Upload, Radio, Select } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { uploadFile, updateJob } from '../../services/jobServices';
import moment from 'moment';
import 'moment-timezone';
import cronstrue from 'cronstrue';
import './AddNew.css';
import RoundedBlackButton from '../Button/Button';
import { useSelector } from 'react-redux';

const { Option } = Select;

const AddNewModal = ({ editingJob, onClose, refreshJobs }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [scheduleType, setScheduleType] = useState('daily');
  const [cronPreview, setCronPreview] = useState('');
  const [selectedTime, setSelectedTime] = useState(null);
  const language = useSelector((state) => state.language);
  const t = (en, ja) => (language === 'ja' ? ja : en);

  // Đồng bộ selectedTime với cron_schedule khi mở modal hoặc khi editingJob thay đổi
  useEffect(() => {
    if (editingJob) {
      setIsModalOpen(true);
      const scheduleType = editingJob.cron_schedule?.includes('?') ? 'custom' : 'daily';
      form.setFieldsValue({
        name: editingJob.name,
        cron_schedule: editingJob.cron_schedule
          ? moment(editingJob.cron_schedule, 'HH:mm')
          : moment(),
        source_folder: editingJob.source_folder,
        destination_folder: editingJob.destination_folder,
        schedule_type: scheduleType,
        custom_cron: editingJob.cron_schedule,
        day_of_week: editingJob.day_of_week,
        day_of_month: editingJob.day_of_month,
      });
      setScheduleType(scheduleType);
      updateCronPreview(editingJob.cron_schedule || '');

      // Parse cron_schedule để lấy giờ và phút nếu không phải custom
      if (editingJob.cron_schedule && scheduleType !== 'custom') {
        const cronParts = editingJob.cron_schedule.split(' ');
        if (cronParts.length >= 2) {
          const minute = parseInt(cronParts[0], 10);
          const hour = parseInt(cronParts[1], 10);
          setSelectedTime(moment({ hour, minute }));
        }
      } else {
        setSelectedTime(null);
      }
    } else {
      setSelectedTime(null);
    }
  }, [editingJob, form]);

  // Khi đổi schedule type, đồng bộ lại selectedTime nếu có
  const handleScheduleTypeChange = (e) => {
    const value = e.target.value;
    setScheduleType(value);
    if (value !== 'custom') {
      const cron_schedule = form.getFieldValue('cron_schedule');
      if (cron_schedule) {
        setSelectedTime(cron_schedule);
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

  const handleFileChange = (file) => {
    if (file.type !== 'text/csv') {
      message.error(t('Only CSV files are allowed.', 'CSVファイルのみ許可されています。'));
      return false;
    }
    setUploadedFile(file);
    return false;
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

  const handleTimeChange = (time) => {
    setSelectedTime(time);
    if (time && scheduleType !== 'custom') {
      const hour = time.hour();
      const minute = time.minute();
      const cron = generateCronFromSelect(
        hour,
        minute,
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
        // Nếu selectedTime không có, lấy từ values.cron_schedule (trường hợp submit mà chưa chọn lại giờ)
        let hour, minute;
        if (selectedTime) {
          hour = selectedTime.hour();
          minute = selectedTime.minute();
        } else if (values.cron_schedule) {
          hour = values.cron_schedule.hour();
          minute = values.cron_schedule.minute();
        } else {
          hour = 0;
          minute = 0;
        }
        cron_schedule = generateCronFromSelect(
          hour,
          minute,
          scheduleType,
          values.day_of_week,
          values.day_of_month
        );
      }

      if (editingJob) {
        const updates = {
          name: values.name,
          cron_schedule,
          source_folder: values.source_folder,
          destination_folder: values.destination_folder,
          day_of_week: values.day_of_week,
          day_of_month: values.day_of_month,
        };

        await updateJob(editingJob.id, updates);
        message.success(t('Job updated successfully!', 'ジョブが正常に更新されました！'));
      } else {
        const data = {
          job_name: values.name,
          cron_schedule,
          input_path: values.source_folder,
          output_path: values.destination_folder,
          output_file_name: values.output_file_name,
        };
        if (values.day_of_week) data.day_of_week = values.day_of_week;
        if (values.day_of_month) data.day_of_month = values.day_of_month;
        data.is_active = true;

        await uploadFile(data);
        message.success(t('Job created successfully!', 'ジョブが正常に作成されました！'));
      }
      handleCancel();
      if (refreshJobs) refreshJobs();
    } catch (error) {
      console.error('Error:', error);
      message.error(
        t('Operation failed. Please try again.', '操作に失敗しました。もう一度お試しください。')
      );
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
    setSelectedTime(null);
    if (onClose) onClose();
  };

  return (
    <>
      {!editingJob && (
        <RoundedBlackButton type="primary" onClick={() => setIsModalOpen(true)}>
          {t('Add New +', '新規追加 +')}
        </RoundedBlackButton>
      )}
      <Modal
        title={editingJob ? t('Edit Job', 'ジョブ編集') : t('Add New Job', '新規ジョブ追加')}
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
            label={t('Job Name', 'ジョブ名')}
            name="name"
            rules={[
              {
                required: true,
                message: t('Please enter the job name', 'ジョブ名を入力してください'),
              },
            ]}
          >
            <Input placeholder={t('Enter job name', 'ジョブ名を入力')} />
          </Form.Item>
          <Form.Item
            label={t('Schedule Type', 'スケジュールタイプ')}
            name="schedule_type"
            rules={[
              {
                required: true,
                message: t('Please select a schedule type', 'スケジュールタイプを選択してください'),
              },
            ]}
          >
            <Radio.Group onChange={handleScheduleTypeChange}>
              <Radio value="run_once">{t('Run Once', '一度だけ実行')}</Radio>
              <Radio value="daily">{t('Daily', '毎日')}</Radio>
              <Radio value="weekly">{t('Weekly', '毎週')}</Radio>
              <Radio value="monthly">{t('Monthly', '毎月')}</Radio>
              <Radio value="custom">{t('Custom', 'カスタム')}</Radio>
            </Radio.Group>
          </Form.Item>
          {scheduleType === 'weekly' && (
            <Form.Item
              label={t('Day of Week', '曜日')}
              name="day_of_week"
              rules={[
                {
                  required: true,
                  message: t('Please select a day of the week', '曜日を選択してください'),
                },
              ]}
            >
              <Select placeholder={t('Select day of week', '曜日を選択')}>
                <Option value="0">{t('Sunday', '日曜日')}</Option>
                <Option value="1">{t('Monday', '月曜日')}</Option>
                <Option value="2">{t('Tuesday', '火曜日')}</Option>
                <Option value="3">{t('Wednesday', '水曜日')}</Option>
                <Option value="4">{t('Thursday', '木曜日')}</Option>
                <Option value="5">{t('Friday', '金曜日')}</Option>
                <Option value="6">{t('Saturday', '土曜日')}</Option>
              </Select>
            </Form.Item>
          )}
          {scheduleType === 'monthly' && (
            <Form.Item
              label={t('Day of Month', '日付')}
              name="day_of_month"
              rules={[
                {
                  required: true,
                  message: t('Please select a day of the month', '日付を選択してください'),
                },
              ]}
            >
              <Select placeholder={t('Select day of month', '日付を選択')}>
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
              label={t('Cron Schedule', 'Cronスケジュール')}
              name="cron_schedule"
              rules={[
                {
                  required: true,
                  message: t('Please select a cron schedule', 'Cronスケジュールを選択してください'),
                },
              ]}
            >
              <TimePicker
                format="HH:mm"
                value={selectedTime}
                onChange={handleTimeChange}
                minuteStep={1}
                placeholder={t('Select time', '時間を選択')}
                style={{ width: 120 }}
              />
            </Form.Item>
          )}
          {scheduleType === 'custom' && (
            <Form.Item
              label={t('Custom Cron Expression', 'カスタムCron式')}
              name="custom_cron"
              rules={[
                {
                  required: true,
                  message: t('Please enter a cron expression', 'Cron式を入力してください'),
                },
              ]}
            >
              <Input
                placeholder={t(
                  'Enter cron expression (e.g., 0 0 12 * * ?)',
                  'Cron式を入力（例: 0 0 12 * * ?）'
                )}
                onChange={handleCustomCronChange}
              />
            </Form.Item>
          )}
          {cronPreview && (
            <Form.Item label={t('Schedule Preview', 'スケジュールプレビュー')}>
              <p style={{ color: cronPreview.includes('Invalid') ? 'red' : 'green' }}>
                {cronPreview}
              </p>
            </Form.Item>
          )}
          {!editingJob && (
            <>
              <Form.Item
                label={t('Input Folder Path', '入力フォルダパス')}
                name="source_folder"
                rules={[
                  {
                    required: true,
                    message: t(
                      'Please enter the input folder path',
                      '入力フォルダパスを入力してください'
                    ),
                  },
                ]}
              >
                <Input
                  placeholder={t(
                    'Enter input folder path (e.g. D:\\data1\\input)',
                    '入力フォルダパスを入力（例: D:\\data1\\input）'
                  )}
                  allowClear
                />
              </Form.Item>
              <Form.Item
                label={t('Output Folder Path', '出力フォルダパス')}
                name="destination_folder"
                rules={[
                  {
                    required: true,
                    message: t(
                      'Please enter the output folder path',
                      '出力フォルダパスを入力してください'
                    ),
                  },
                ]}
              >
                <Input
                  placeholder={t(
                    'Enter output folder path (e.g. D:\\data1\\output)',
                    '出力フォルダパスを入力（例: D:\\data1\\output）'
                  )}
                  allowClear
                />
              </Form.Item>
              <Form.Item
                label={t('Output File Name', '出力ファイル名')}
                name="output_file_name"
                rules={[
                  {
                    required: true,
                    message: t(
                      'Please enter the output file name',
                      '出力ファイル名を入力してください'
                    ),
                  },
                ]}
              >
                <Input
                  placeholder={t(
                    'Enter output file name (e.g. example.csv)',
                    '出力ファイル名を入力（例: example.csv）'
                  )}
                  allowClear
                />
              </Form.Item>
            </>
          )}
          {/* {!editingJob && (
            <Form.Item
              label={t('Source File', 'ソースファイル')}
              name="source_file"
              rules={[
                {
                  required: true,
                  message: t('Please select a source file', 'ソースファイルを選択してください'),
                },
              ]}
            >
              <Upload beforeUpload={handleFileChange} showUploadList={false}>
                <Button icon={<UploadOutlined />}>{t('Select File', 'ファイルを選択')}</Button>
              </Upload>
              {uploadedFile && (
                <p>
                  {t('Selected File:', '選択されたファイル:')} {uploadedFile.name}
                </p>
              )}
            </Form.Item>
          )} */}
          <Form.Item>
            <Button onClick={handleCancel}>{t('Cancel', 'キャンセル')}</Button>
            <Button type="primary" htmlType="submit" loading={isLoading} style={{ marginLeft: 8 }}>
              {editingJob ? t('Update Job', 'ジョブを更新') : t('Create', '作成')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AddNewModal;
