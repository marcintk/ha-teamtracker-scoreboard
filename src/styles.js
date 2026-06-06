export const CARD_STYLES = `
  :host { display: block; }

  ha-card {
    padding: 4px 8px 4px 6px;
    box-sizing: border-box;
    overflow-y: auto;
    font-family: var(--paper-font-body1_-_font-family, sans-serif);
    color: #888;
    font-size: 14px;
  }

  .section-header {
    color: #2196F3; /* Material Blue */
    font-size: 15px;
    padding: 2px 0 2px 0;
    margin-top: 1px;
  }

  .game-row {
    display: flex;
    align-items: center;
    height: 28px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    gap: 0;
  }

  .team-col {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100px;
    min-width: 60px;
    overflow: hidden;
  }
  .team-col-a { text-align: right; padding-right: 3px; }
  .team-col-b { text-align: left;  padding-left: 3px;  }

  .team-name {
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
  }
  .team-rank {
    font-size: 9px;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
  }

  .logo {
    width: 26px;
    min-width: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 28px;
  }
  .logo-a { padding-right: 3px; }
  .logo-b { padding-left:  3px; }
  .logo img {
    width: 22px;
    height: 22px;
    object-fit: contain;
    display: block;
  }

  .score {
    width: 30px;
    min-width: 30px;
    font-size: 17px;
    font-weight: bold;
    text-align: center;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .colon {
    width: 16px;
    min-width: 16px;
    font-size: 17px;
    font-weight: bold;
    text-align: center;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tv {
    flex-shrink: 0;
    text-align: center;
    font-size: 0;
    padding: 0 3px;
  }
  .tv-badge {
    font-size: 8px;
    font-weight: bold;
    color: #fff;
    border-radius: 3px;
    padding: 1px 3px;
    white-space: nowrap;
  }

  .message {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-size: 13px;
    font-weight: bold;
    line-height: 1.2;
    overflow: hidden;
    padding-left: 4px;
  }
  .msg-sub {
    font-size: 10px;
    font-weight: normal;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .empty {
    padding: 8px 4px;
    font-size: 13px;
    color: #555;
  }
`;
