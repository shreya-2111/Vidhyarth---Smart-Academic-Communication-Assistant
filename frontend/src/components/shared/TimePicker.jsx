import React, { useState, useEffect } from 'react';
import './TimePicker.css';

function TimePicker({ value, onChange, name, required }) {
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('AM');

  // Convert 24-hour format to 12-hour format on mount/value change
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      const hourNum = parseInt(h, 10);
      const isPM = hourNum >= 12;
      const hour12 = hourNum % 12 || 12;
      
      setHour(hour12.toString().padStart(2, '0'));
      setMinute((m || '00').toString().substring(0, 2).padStart(2, '0'));
      setPeriod(isPM ? 'PM' : 'AM');
    }
  }, [value]);

  // Convert 12-hour format to 24-hour format and notify parent
  const updateTime = (newHour, newMinute, newPeriod) => {
    let hour24 = parseInt(newHour, 10);
    
    if (newPeriod === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (newPeriod === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    const time24 = `${hour24.toString().padStart(2, '0')}:${newMinute}`;
    onChange({ target: { name, value: time24 } });
  };

  const handleHourChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val === '') {
      setHour('');
      return;
    }
    
    let num = parseInt(val, 10);
    if (num > 12) num = 12;
    if (num < 1) num = 1;
    
    const formatted = num.toString().padStart(2, '0');
    setHour(formatted);
    updateTime(formatted, minute, period);
  };

  const handleMinuteChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val === '') {
      setMinute('');
      return;
    }
    
    let num = parseInt(val, 10);
    if (num > 59) num = 59;
    if (num < 0) num = 0;
    
    const formatted = num.toString().padStart(2, '0');
    setMinute(formatted);
    updateTime(hour, formatted, period);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    updateTime(hour, minute, newPeriod);
  };

  return (
    <div className="time-picker-12hr">
      <input
        type="text"
        className="time-input hour"
        value={hour}
        onChange={handleHourChange}
        placeholder="12"
        maxLength="2"
        required={required}
      />
      <span className="time-separator">:</span>
      <input
        type="text"
        className="time-input minute"
        value={minute}
        onChange={handleMinuteChange}
        placeholder="00"
        maxLength="2"
        required={required}
      />
      <div className="period-selector">
        <select 
          className="period-select"
          value={period}
          onChange={(e) => handlePeriodChange(e.target.value)}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}

export default TimePicker;
