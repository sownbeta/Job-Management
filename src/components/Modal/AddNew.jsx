import React, { useState } from 'react';
import './AddNew.css';
import { Modal, Button, Input, message } from 'antd';

const AddNewModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [cronExpression, setCronExpression] = useState({
    minute: '',
    hour: '',
    day: '',
    month: '',
    week: '',
  });
  const [errors, setErrors] = useState({
    minute: '',
    hour: '',
    day: '',
    month: '',
    week: '',
  });

  const buttons = ['Startup', 'Hourly', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

  const validateField = (field, value) => {
    if (value && !/^\d*$/.test(value)) {
      return 'Numbers only';
    }

    switch (field) {
      case 'minute':
        if (value && (parseInt(value) < 0 || parseInt(value) > 59)) {
          return 'Minute must be from 0 to 59';
        }
        break;
      case 'hour':
        if (value && (parseInt(value) < 0 || parseInt(value) > 23)) {
          return 'Hour must be from 0 to 23';
        }
        break;
      case 'day':
        if (value && (parseInt(value) < 1 || parseInt(value) > 31)) {
          return 'Day must be from 1 to 31';
        }
        break;
      case 'month':
        if (value && (parseInt(value) < 1 || parseInt(value) > 12)) {
          return 'Month must be from 1 to 12';
        }
        break;
      case 'week':
        if (value && (parseInt(value) < 0 || parseInt(value) > 6)) {
          return 'Week must be from 0 to 6 (0: Sunday, 6: Saturday)';
        }
        break;
      default:
        break;
    }
    return '';
  };

  const handleChange = (field, value) => {
    const error = validateField(field, value);
    setErrors({
      ...errors,
      [field]: error,
    });

    // Chỉ cập nhật nếu giá trị hợp lệ hoặc rỗng
    if (!error || value === '') {
      setCronExpression({
        ...cronExpression,
        [field]: value,
      });
    }
  };

  const validateCron = () => {
    const { minute, hour, day, month, week } = cronExpression;
    const newErrors = {};

    newErrors.minute = validateField('minute', minute);
    newErrors.hour = validateField('hour', hour);
    newErrors.day = validateField('day', day);
    newErrors.month = validateField('month', month);
    newErrors.week = validateField('week', week);

    setErrors(newErrors);

    // Kiểm tra nếu có lỗi
    if (Object.values(newErrors).some((error) => error)) {
      message.error('Please double check the input fields');
      return false;
    }

    // Kiểm tra nếu các trường bắt buộc bị rỗng
    if (!minute || !hour || !day || !month || !week) {
      message.error('All fields are required');
      return false;
    }

    return true;
  };

  const handleSetCron = () => {
    if (validateCron()) {
      console.log(
        'Cron Expression:',
        `${cronExpression.minute} ${cronExpression.hour} ${cronExpression.day} ${cronExpression.month} ${cronExpression.week}`
      );
      message.success('Cron expression has been set up successfully!');
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const handleClear = () => {
    setCronExpression({
      minute: '',
      hour: '',
      day: '',
      month: '',
      week: '',
    });
    setSelected(null);
    setJob('');
    message.info('Form has been cleared!');
  };

  return (
    <>
      <Button type="primary" onClick={showModal}>
        Add New +
      </Button>
      <Modal title="Add New" open={isModalOpen} onCancel={handleCancel} footer={null}>
        <div className="modal-container">
          <label htmlFor="name">Name (Optional)</label>
          <Input placeholder="Please enter name" id="name" />

          <label htmlFor="command">Command</label>
          <Input placeholder="Please enter command" id="command" />

          <div className="option-button">
            <label htmlFor="">Quick Schedule</label>
            <div className="button-group">
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
        </div>

        <div className="cron-scheduler">
          <div className="fields">
            {[
              { id: 'minute', label: 'Minute (*)', placeholder: 'Minute' },
              { id: 'hour', label: 'Hour (*)', placeholder: 'Hour' },
              { id: 'day', label: 'Day (*)', placeholder: 'Day' },
              { id: 'month', label: 'Month (*)', placeholder: 'Month' },
              { id: 'week', label: 'Week (*)', placeholder: 'Week' },
            ].map((field) => (
              <div className="field-group" key={field.id}>
                <label htmlFor={field.id}>{field.label}</label>
                <Input
                  id={field.id}
                  placeholder={field.placeholder}
                  value={cronExpression[field.id]}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className="field"
                  type="text"
                  status={errors[field.id] ? 'error' : ''}
                />
                {errors[field.id] && (
                  <div style={{ color: 'red', fontSize: '12px' }}>{errors[field.id]}</div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="job-wrapper">
          <label htmlFor="job">Job</label>
          <Input placeholder="Please enter job" id="job" />
        </div>
        <div className="submit-button">
          <Button type="default" onClick={handleClear} className="clear-button">
            Clear
          </Button>
          <Button type="primary" onClick={handleSetCron} className="set-button">
            Set
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default AddNewModal;
