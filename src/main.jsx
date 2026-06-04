import React from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowUpRight,
  BarChart3,
  Github,
  Mail,
  MessageCircle,
  Sparkles,
  TrendingUp
} from 'lucide-react'

import avatar from './assets/avatar.jpeg'
import qrcode from './assets/qrcode.png'
import './styles.css'

const profile = {
  name: 'liihuu',
  title: 'Frontend Engineer / Open Source Author',
  email: 'hu_li888@foxmail.com',
  github: 'https://github.com/liihuu',
  weibo: 'https://weibo.com/u/2378413570',
  klineChart: 'https://github.com/klinecharts/KLineChart'
}

const highlights = [
  {
    value: 'FinTech',
    label: '多年金融前端工程实践，关注行情、交易、数据密度与性能体验。'
  },
  {
    value: 'KLineChart',
    label: '开源图表项目作者，持续打磨金融 K 线图的可用性与工程化。'
  },
  {
    value: 'Frontend',
    label: '偏爱清晰的架构、稳定的交互和能够长期维护的产品代码。'
  }
]

const focusAreas = [
  '金融行情与交易终端',
  '高性能 Canvas / SVG 数据可视化',
  'React 工程架构与组件系统',
  '开源项目维护与开发者体验'
]

const projects = [
  {
    name: 'KLineChart',
    description:
      '面向金融场景的专业 K 线图表库，覆盖指标、绘图、交互和高度可定制的图表体验。',
    href: profile.klineChart,
    meta: 'Open Source / Financial Charting',
    icon: TrendingUp
  },
  {
    name: 'Financial Frontend',
    description:
      '围绕行情、交易、风控与运营后台沉淀前端工程能力，在复杂信息密度下保持产品可用。',
    href: `mailto:${profile.email}`,
    meta: 'Work / Product Engineering',
    icon: BarChart3
  }
]

function App () {
  return (
    <main className="site-shell">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-media" aria-hidden="true" />
        <div className="hero-overlay" />
        <nav className="top-nav" aria-label="Primary navigation">
          <a href="#work">Work</a>
          <a href="#open-source">Open Source</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="hero-content">
          <div className="avatar-wrap">
            <img src={avatar} alt="liihuu portrait" />
          </div>
          <p className="eyebrow">
            <Sparkles size={16} strokeWidth={1.8} />
            Frontend Engineer in FinTech
          </p>
          <h1 id="hero-title">liihuu</h1>
          <p className="hero-copy">
            我是一名前端工程师，长期从事金融前端开发，也是开源项目
            <a href={profile.klineChart} target="_blank" rel="noreferrer"> KLineChart </a>
            的作者。关注复杂数据场景里的性能、可读性和稳定体验。
          </p>
          <div className="hero-actions" aria-label="Primary links">
            <a className="button primary" href={profile.klineChart} target="_blank" rel="noreferrer">
              KLineChart
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <a className="button secondary" href={profile.github} target="_blank" rel="noreferrer">
              <Github size={18} aria-hidden="true" />
              GitHub
            </a>
          </div>
        </div>
      </section>

      <section className="summary-band" aria-label="Profile highlights">
        {highlights.map((item) => (
          <article className="metric" key={item.value}>
            <strong>{item.value}</strong>
            <p>{item.label}</p>
          </article>
        ))}
      </section>

      <section className="section-grid" id="work">
        <div className="section-heading">
          <p className="section-kicker">What I Work On</p>
          <h2>把复杂金融数据做成稳定、清晰、可信赖的前端体验。</h2>
        </div>
        <div className="focus-list">
          {focusAreas.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="project-section" id="open-source">
        <div className="section-heading">
          <p className="section-kicker">Selected Work</p>
          <h2>开源与金融前端实践。</h2>
        </div>
        <div className="project-list">
          {projects.map((project) => {
            const Icon = project.icon
            return (
              <a className="project-card" href={project.href} target="_blank" rel="noreferrer" key={project.name}>
                <span className="project-icon">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <span className="project-meta">{project.meta}</span>
                <strong>{project.name}</strong>
                <p>{project.description}</p>
                <span className="project-link">
                  Visit
                  <ArrowUpRight size={17} aria-hidden="true" />
                </span>
              </a>
            )
          })}
        </div>
      </section>

      <section className="contact-band" id="contact">
        <div>
          <p className="section-kicker">Contact</p>
          <h2>欢迎交流金融前端、图表工程和开源项目。</h2>
        </div>
        <div className="contact-actions">
          <a className="icon-link" href={`mailto:${profile.email}`} aria-label="Send email">
            <Mail size={21} aria-hidden="true" />
          </a>
          <a className="icon-link" href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub profile">
            <Github size={21} aria-hidden="true" />
          </a>
          <div className="wechat" aria-label="WeChat QR code">
            <button className="icon-link" type="button" aria-label="Show WeChat QR code">
              <MessageCircle size={21} aria-hidden="true" />
            </button>
            <div className="qr-panel">
              <img src={qrcode} alt="liihuu WeChat QR code" />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
