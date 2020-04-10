import React from 'react'

import avatar from './assets/avatar.jpeg'
import qrcode from './assets/qrcode.png'

import './app.less'

function App () {
  return (
    <div className="app">
      <div className="app-content">
        <img alt="avatar" className="app-avatar" src={avatar}/>
        <h1 className="app-name">liihuu</h1>
        <p className="app-introduce">Web&nbsp;/&nbsp;Android&nbsp;&nbsp;Developer</p>
        <div className="app-contact app-icon">
          <a
            className="icon-github app-icon"
            target="_blank"
            rel="noopener noreferrer nofollow"
            href="https://github.com/liihuu"/>
          <a className="icon-weichat app-icon">
            <div className="app-icon-qr-container">
              <i className="app-icon-qr-triangle"/>
              <img alt="qrcode" className="app-icon-qr" src={qrcode}/>
            </div>
          </a>
          <a
            className="icon-weibo app-icon"
            target="_blank"
            rel="noopener noreferrer nofollow"
            href="https://weibo.com/u/2378413570"
          />
          <a
            className="icon-mail app-icon"
            href="mailto:hu_li888@foxmail.com"/>
        </div>
        <p className="app-footer">
          Copyright © 2019
          <a
            target="_blank"
            rel="noopener noreferrer nofollow"
            href="https://github.com/liihuu">
            &nbsp;liihuu&nbsp;
          </a>
          All Rights Reserved.
        </p>
      </div>
    </div>
  )
}

export default App
