import React, { useEffect, useState } from 'react';
import { Button, TimePicker, Form, Input, message, Modal, DatePicker, Radio } from 'antd';
import { uploadFile, updateJob } from '../../services/jobServices';
import moment from 'moment';
import 'moment-timezone';
import cronstrue from 'cronstrue';
import './AddNew.css';
import RoundedBlackButton from '../Button/Button';
import { useSelector } from 'react-redux';
import { dateToCron } from '../../utils/helper'; // Updated import

const AddNewModal = ({ editingJob, onClose, refreshJobs }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [scheduleType, setScheduleType] = useState('daily');
  const [cronPreview, setCronPreview] = useState('');
  const language = useSelector((state) => state.language);
  const t = (en, ja) => (language === 'ja' ? ja : en);

  useEffect(() => {
    if (editingJob) {
      setIsModalOpen(true);
      const scheduleType = editingJob.cron_schedule?.includes('?') ? 'custom' : 'daily';
      form.setFieldsValue({
        name: editingJob.name,
        cron_schedule: editingJob.cron_schedule
          ? moment(editingJob.cron_schedule, 'HH:mm')
          : moment(),
        schedule_type: scheduleType,
        input_path: editingJob.source_folder,
        output_path: editingJob.destination_folder,
        output_file_name: editingJob.output_file_name,
        custom_cron: editingJob.cron_schedule,
      });
      setScheduleType(scheduleType);
      updateCronPreview(editingJob.cron_schedule || '');
    }
  }, [editingJob, form]);

  const updateCronPreview = (cron) => {
    try {
      const description = cronstrue.toString(cron, { throwExceptionOnParseError: true });
      setCronPreview(description);
    } catch {
      setCronPreview(t('Invalid cron expression', '無効なcron式'));
    }
  };

  const handleScheduleTypeChange = (e) => {
    const value = e.target.value;
    setScheduleType(value);
    if (value !== 'custom') {
      const cron_schedule = form.getFieldValue('cron_schedule');
      if (cron_schedule) {
        const cron = dateToCron(cron_schedule, value, form);
        updateCronPreview(cron);
      }
    }
  };

  const handleTimeChange = (time) => {
    if (time && scheduleType !== 'custom') {
      const cron = dateToCron(time, scheduleType, form);
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
      const cron_schedule =
        scheduleType === 'custom'
          ? values.custom_cron
          : dateToCron(values.cron_schedule, scheduleType, form);

      const data = {
        job_name: values.name,
        cron_schedule,
        input_path: values.input_path,
        output_path: values.output_path,
        output_file_name: values.output_file_name || 'output.csv',
      };

      if (editingJob) {
        await updateJob(editingJob.id, data);
        message.success(t('Job updated successfully!', 'ジョブが正常に更新されました！'));
      } else {
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
    setScheduleType('daily');
    setCronPreview('');
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
            cron_schedule: moment().tz('Asia/Tokyo'),
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
              <Radio value="custom">{t('Custom', 'カスタム')}</Radio>
            </Radio.Group>
          </Form.Item>
          {scheduleType === 'run_once' && (
            <Form.Item
              label={t('Run Once', '一度だけ実行')}
              name="cron_schedule"
              rules={[
                {
                  required: true,
                  message: t('Please select a date and time', '日時を選択してください'),
                },
              ]}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                placeholder={t('Select date and time', '日時を選択')}
                onChange={handleTimeChange}
              />
            </Form.Item>
          )}
          {scheduleType === 'daily' && (
            <Form.Item
              label={t('Daily Time', '毎日の時間')}
              name="cron_schedule"
              rules={[
                {
                  required: true,
                  message: t('Please select a time', '時間を選択してください'),
                },
              ]}
            >
              <TimePicker
                format="HH:mm:ss"
                placeholder={t('Select time', '時間を選択')}
                onChange={handleTimeChange}
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
          <Form.Item
            label={t('Input Folder Path', '入力フォルダパス')}
            name="input_path"
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
            name="output_path"
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
                message: t('Please enter the output file name', '出力ファイル名を入力してください'),
              },
              {
                pattern: /\.csv$/,
                message: t(
                  'File name must end with .csv',
                  'ファイル名は.csvで終わる必要があります'
                ),
              },
            ]}
          >
            <Input
              placeholder={t(
                'Enter output file name (e.g. result.csv)',
                '出力ファイル名を入力（例: result.csv）'
              )}
              allowClear
            />
          </Form.Item>
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
