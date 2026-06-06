import React from 'react'
import { createRoot } from 'react-dom/client'

import qrcode from './assets/qrcode.png'
import ChartBackground from './ChartBackground'
import ThemeSwitcher from './ThemeSwitcher'
import { applyTheme, getStoredTheme } from './themes'
import './styles.css'

applyTheme(getStoredTheme())

const profile = {
  name: 'liihuu',
  role: '前端开发工程师',
  email: 'hu_li888@foxmail.com',
  github: 'https://github.com/liihuu',
  klineChart: 'https://github.com/klinecharts/KLineChart'
}

function App () {
  return (
    <div className="page">
      <ThemeSwitcher />
      <ChartBackground />
      <main className="shell">
        <section className="profile">
          <img className="avatar" src="/avatar.jpg" alt="" width={128} height={128} />
          <h1>{profile.name}</h1>
          <p className="role">{profile.role}</p>
          <div className="bio">
            <p>多年金融行业经验，擅长行情交易类产品开发。</p>
            <p>
              开源项目{' '}
              <a href={profile.klineChart} target="_blank" rel="noreferrer">
                KLineChart
              </a>{' '}
              的作者。
            </p>
          </div>
        </section>

        <nav className="contact" aria-label="联系方式">
          <a href={`mailto:${profile.email}`} title={profile.email}>
            <svg viewBox="0 0 1024 1024">
              <path fill="currentColor" d="M789.333333 128a170.666667 170.666667 0 0 1 170.666667 170.666667v426.666666a170.666667 170.666667 0 0 1-170.666667 170.666667H234.666667a170.666667 170.666667 0 0 1-170.666667-170.666667V298.666667a170.666667 170.666667 0 0 1 170.666667-170.666667h554.666666z m106.666667 243.797333l-310.613333 147.925334a170.666667 170.666667 0 0 1-146.773334 0L128 371.797333V725.333333a106.666667 106.666667 0 0 0 102.037333 106.56L234.666667 832h554.666666a106.666667 106.666667 0 0 0 106.56-102.037333L896 725.333333V371.797333zM789.333333 192H234.666667a106.666667 106.666667 0 0 0-106.56 102.037333L128 300.928l338.133333 161.024a106.666667 106.666667 0 0 0 86.549334 2.282667l5.184-2.282667L896 300.906667V298.666667a106.666667 106.666667 0 0 0-102.037333-106.56L789.333333 192z" />
            </svg>
            邮箱
          </a>
          <a href={profile.github} target="_blank" rel="noreferrer">
            <svg viewBox="0 0 1024 1024">
              <path fill="currentColor" d="M511.6 76.3C264.3 76.2 64 276.4 64 523.5 64 718.9 189.3 885 363.8 946c23.5 5.9 19.9-10.8 19.9-22.2v-77.5c-135.7 15.9-141.2-73.9-150.3-88.9C215 726 171.5 718 184.5 703c30.9-15.9 62.4 4 98.9 57.9 26.4 39.1 77.9 32.5 104 26 5.7-23.5 17.9-44.5 34.7-60.8-140.6-25.2-199.2-111-199.2-213 0-49.5 16.3-95 48.3-131.7-20.4-60.5 1.9-112.3 4.9-120 58.1-5.2 118.5 41.6 123.2 45.3 33-8.9 70.7-13.6 112.9-13.6 42.4 0 80.2 4.9 113.5 13.9 11.3-8.6 67.3-48.8 121.3-43.9 2.9 7.7 24.7 58.3 5.5 118 32.4 36.8 48.9 82.7 48.9 132.3 0 102.2-59 188.1-200 212.9 23.5 23.2 38.1 55.4 38.1 91v112.5c0.8 9 0 17.9 15 17.9 177.1-59.7 304.6-227 304.6-424.1 0-247.2-200.4-447.3-447.5-447.3z" />
            </svg>
            GitHub
          </a>
          <div className="wechat">
            <button type="button">
              <svg viewBox="0 0 1024 1024">
                <path fill="currentColor" d="M384 102.4C172.8 102.4 0 240 0 409.6c0 96 54.4 182.4 140.8 240L102.4 768l128-76.8c44.8 16 96 25.6 150.4 25.6-12.8-32-22.4-67.2-22.4-102.4 0-169.6 160-307.2 358.4-307.2h28.8C694.4 188.8 550.4 102.4 384 102.4m-153.6 128c28.8 0 51.2 22.4 51.2 51.2s-22.4 51.2-51.2 51.2-51.2-22.4-51.2-51.2c0-28.8 22.4-51.2 51.2-51.2m256 0c28.8 0 51.2 22.4 51.2 51.2s-22.4 51.2-51.2 51.2-51.2-22.4-51.2-51.2c0-28.8 22.4-51.2 51.2-51.2m230.4 128c-169.6 0-307.2 115.2-307.2 256s137.6 256 307.2 256c35.2 0 67.2-3.2 99.2-12.8l105.6 64-32-96c80-48 134.4-124.8 134.4-211.2 0-140.8-137.6-256-307.2-256m-102.4 128c28.8 0 51.2 22.4 51.2 51.2 0 28.8-22.4 51.2-51.2 51.2-28.8 0-51.2-22.4-51.2-51.2 0-28.8 22.4-51.2 51.2-51.2m204.8 0c28.8 0 51.2 22.4 51.2 51.2 0 28.8-22.4 51.2-51.2 51.2-28.8 0-51.2-22.4-51.2-51.2 0-28.8 22.4-51.2 51.2-51.2z" />
              </svg>
              微信
            </button>
            <div className="wechat__qr">
              <img src={qrcode} alt="微信二维码" width={128} height={128} />
            </div>
          </div>
        </nav>

        <footer className="footer">© {new Date().getFullYear()} {profile.name}</footer>
      </main>
    </div>
  )
}

const rootElement = document.getElementById('root')
const root = rootElement.__reactRoot ?? createRoot(rootElement)
rootElement.__reactRoot = root
root.render(<App />)
