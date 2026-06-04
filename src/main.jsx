import React from 'react'
import { createRoot } from 'react-dom/client'
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Code2,
  Cpu,
  GitBranch,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp
} from 'lucide-react'

import avatar from './assets/avatar.jpeg'
import qrcode from './assets/qrcode.png'
import './styles.css'

const profile = {
  name: 'liihuu',
  role: '金融前端工程师',
  email: 'hu_li888@foxmail.com',
  github: 'https://github.com/liihuu',
  klineChart: 'https://github.com/klinecharts/KLineChart'
}

const signals = [
  { value: '金融前端', label: '长期服务行情、交易、运营与数据密集型产品' },
  { value: '图表工程', label: '关注高频数据渲染、交互反馈和指标表达' },
  { value: '开源作者', label: '持续维护 KLineChart，打磨开发者使用体验' }
]

const capabilities = [
  {
    title: '复杂数据界面',
    text: '把行情、指标、订单和状态信息组织成可扫描、可判断、可操作的界面。',
    icon: BarChart3
  },
  {
    title: '高性能可视化',
    text: '围绕 Canvas、SVG 与前端渲染链路，优化大数据量下的稳定体验。',
    icon: Activity
  },
  {
    title: '工程化交付',
    text: '用清晰的组件边界、类型约束和构建流程支撑长期迭代。',
    icon: Code2
  },
  {
    title: '可靠产品体验',
    text: '在高信息密度场景里保持响应速度、异常兜底和交互一致性。',
    icon: ShieldCheck
  }
]

const projects = [
  {
    name: 'KLineChart',
    description:
      '面向金融场景的专业 K 线图表库，覆盖指标、绘图、交互、主题和高度定制能力。',
    href: profile.klineChart,
    tag: '开源图表库',
    icon: TrendingUp
  },
  {
    name: '金融前端实践',
    description:
      '沉淀行情终端、交易链路、风控后台和运营系统中的前端架构经验。',
    href: `mailto:${profile.email}`,
    tag: '产品工程',
    icon: Cpu
  }
]

function App () {
  return (
    <main className="site-shell">
      <section className="hero" aria-labelledby="hero-title">
        <nav className="top-nav" aria-label="站内导航">
          <a href="#work">能力</a>
          <a href="#projects">项目</a>
          <a href="#contact">联系</a>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <Sparkles size={16} strokeWidth={1.8} />
              {profile.role}
            </p>
            <h1 id="hero-title">
              <span>构建清晰、稳定、</span>
              <span>可扩展的</span>
              <span>金融前端体验。</span>
            </h1>
            <p className="hero-lede">
              我是 {profile.name}，专注金融前端工程与数据可视化。长期处理行情、交易和高密度信息界面，也在持续维护开源项目 KLineChart。
            </p>
            <div className="hero-actions" aria-label="主要链接">
              <a className="button primary" href={profile.klineChart} target="_blank" rel="noreferrer">
                查看 KLineChart
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
              <a className="button secondary" href={profile.github} target="_blank" rel="noreferrer">
                <GitBranch size={18} aria-hidden="true" />
                访问代码主页
              </a>
            </div>
          </div>

          <aside className="terminal-panel" aria-label="个人概览">
            <div className="panel-header">
              <span />
              <span />
              <span />
            </div>
            <div className="avatar-row">
              <img src={avatar} alt="liihuu 头像" />
              <div>
                <strong>{profile.name}</strong>
                <p>{profile.role}</p>
              </div>
            </div>
            <dl className="profile-stack">
              <div>
                <dt>方向</dt>
                <dd>金融终端、交易系统、图表库</dd>
              </div>
              <div>
                <dt>关注</dt>
                <dd>性能、稳定性、开发者体验</dd>
              </div>
              <div>
                <dt>状态</dt>
                <dd>持续构建中</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="signal-band" aria-label="专业标签">
        {signals.map((item) => (
          <article className="signal-card" key={item.value}>
            <strong>{item.value}</strong>
            <p>{item.label}</p>
          </article>
        ))}
      </section>

      <section className="content-section" id="work">
        <div className="section-heading">
          <p className="section-kicker">能力版图</p>
          <h2>从数据渲染到产品交付，处理金融场景里的复杂度。</h2>
        </div>
        <div className="capability-grid">
          {capabilities.map((item) => {
            const Icon = item.icon
            return (
              <article className="capability-card" key={item.title}>
                <span className="card-icon">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="content-section projects" id="projects">
        <div className="section-heading">
          <p className="section-kicker">代表工作</p>
          <h2>把工程判断落到可复用的项目和稳定的业务体验里。</h2>
        </div>
        <div className="project-list">
          {projects.map((project) => {
            const Icon = project.icon
            return (
              <a className="project-card" href={project.href} target="_blank" rel="noreferrer" key={project.name}>
                <span className="project-tag">{project.tag}</span>
                <span className="project-icon">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <strong>{project.name}</strong>
                <p>{project.description}</p>
                <span className="project-link">
                  继续查看
                  <ArrowUpRight size={17} aria-hidden="true" />
                </span>
              </a>
            )
          })}
        </div>
      </section>

      <section className="contact-band" id="contact">
        <div>
          <p className="section-kicker">联系我</p>
          <h2>欢迎交流金融前端、图表工程、开源协作与产品实现。</h2>
        </div>
        <div className="contact-actions">
          <a className="icon-link" href={`mailto:${profile.email}`} aria-label="发送邮件">
            <Mail size={21} aria-hidden="true" />
          </a>
          <a className="icon-link" href={profile.github} target="_blank" rel="noreferrer" aria-label="访问代码主页">
            <GitBranch size={21} aria-hidden="true" />
          </a>
          <div className="wechat" aria-label="微信二维码">
            <button className="icon-link" type="button" aria-label="显示微信二维码">
              <MessageCircle size={21} aria-hidden="true" />
            </button>
            <div className="qr-panel">
              <img src={qrcode} alt="liihuu 微信二维码" />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

const rootElement = document.getElementById('root')
const root = rootElement.__reactRoot ?? createRoot(rootElement)
rootElement.__reactRoot = root
root.render(<App />)
