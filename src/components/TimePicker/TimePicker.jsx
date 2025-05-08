import React, { useState } from 'react';
import { TimePicker, Select, Button, Typography } from 'antd';

const { Option } = Select;
const { Text } = Typography;

const CronTimePicker = ({ onCronChange }) => {
  const [time, setTime] = useState(null);
  const [dayOfWeek, setDayOfWeek] = useState(null);
  const [cronString, setCronString] = useState('');

  const handleGenerateCron = () => {
    if (!time || dayOfWeek === null) return;

    const minute = time.$m; // lấy phút
    const hour = time.$H; // lấy giờ

    const cron = `${minute} ${hour} * * ${dayOfWeek}`;
    setCronString(cron);

    if (onCronChange) onCronChange(cron);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <TimePicker format="HH:mm" onChange={setTime} placeholder="Chọn giờ" />
        <Select placeholder="Chọn thứ" style={{ width: 150 }} onChange={setDayOfWeek}>
          <Option value={0}>Chủ nhật</Option>
          <Option value={1}>Thứ 2</Option>
          <Option value={2}>Thứ 3</Option>
          <Option value={3}>Thứ 4</Option>
          <Option value={4}>Thứ 5</Option>
          <Option value={5}>Thứ 6</Option>
          <Option value={6}>Thứ 7</Option>
        </Select>
        <Button type="primary" onClick={handleGenerateCron}>
          Tạo cron
        </Button>
      </div>

      {cronString && <Text code>Mã cron: {cronString}</Text>}
    </div>
  );
};

export default CronTimePicker;
