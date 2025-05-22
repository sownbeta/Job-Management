import { FileTextOutlined } from '@ant-design/icons';
import { Switch as AntdSwitch } from 'antd';
import RoundedBlackButton from '../../Button/Button';

const Header = ({
  language,
  t,
  handleLanguageSwitch,
  openBackupModal,
  handleHistoryButtonClick,
  setEditJobData,
}) => (
  <div className="header">
    {t('Job Management System', 'ジョブ管理システム')}
    <div className="button-group">
      <AntdSwitch
        checkedChildren="日本語"
        unCheckedChildren="English"
        checked={language === 'ja'}
        onChange={handleLanguageSwitch}
        style={{ marginRight: 16, marginTop: '5px' }}
      />
      <RoundedBlackButton type="primary" onClick={() => setEditJobData(null)}>
        {t('Add New +', '新規追加 +')}
      </RoundedBlackButton>
      <RoundedBlackButton type="default" onClick={openBackupModal}>
        {t('🗑️Bin', '🗑️ビン')}
      </RoundedBlackButton>
      <button className="history-button" onClick={handleHistoryButtonClick}>
        <FileTextOutlined /> {t('Jobs History', 'ジョブ履歴')}
      </button>
    </div>
  </div>
);

export default Header;