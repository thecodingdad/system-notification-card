/**
 * System Notification Card for Home Assistant
 * =============================================
 * v2.0.0
 *
 * Config options:
 *   type: custom:system-notification-card
 *   title: "System Notifications"                      # optional card title
 *   layout: "single"                                   # "single" = one card, "individual" = each item is its own card
 *   show_section_headers: true                         # show section headers with counts
 *   section_order:                                     # order + visibility of sections
 *     - id: updates
 *       visible: true
 *     - id: notifications
 *       visible: true
 *     - id: repairs
 *       visible: true
 */

const SYSTEM_NOTIFICATION_CARD_VERSION = '1.0.0';

const { t } = await import(`./i18n/index.js?v=${SYSTEM_NOTIFICATION_CARD_VERSION}`);

// ── LitElement from HA's frontend bundle ───────────────────────────
const LitElement = Object.getPrototypeOf(customElements.get('ha-panel-lovelace'));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

// ── Constants ──────────────────────────────────────────────────────
const DEFAULT_SECTIONS = [
  { id: 'updates',       visible: true },
  { id: 'notifications', visible: true },
  { id: 'repairs',       visible: true },
];

const SECTION_KEYS = {
  updates:       'Updates',
  notifications: 'Notifications',
  repairs:       'Repairs',
};

// ── Editor form schema ─────────────────────────────────────────────
const EDITOR_SCHEMA = [
  { name: 'title',                selector: { text: {} } },
  { name: 'show_section_headers', selector: { boolean: {} } },
];

const EDITOR_LABELS = {
  title:                'Title',
  show_section_headers: 'Show Section Headers',
};

// ── System Notification Card ────────────────────────────────────────
class SystemNotificationCard extends LitElement {

  static get properties() {
    return {
      hass:           { attribute: false },
      _config:        { state: true },
      _repairs:       { state: true },
      _notifications: { state: true },
    };
  }

  static get styles() {
    return css`
      :host { display: block; }
      ha-card { overflow: hidden; }

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        font-size: 16px;
        font-weight: 500;
        color: var(--primary-text-color);
      }
      .badge {
        background: var(--primary-color);
        color: var(--text-primary-color, #fff);
        border-radius: 12px;
        padding: 2px 8px;
        font-size: 12px;
        font-weight: 500;
        min-width: 20px;
        text-align: center;
      }

      .section + .section {
        border-top: 1px solid var(--divider-color);
      }
      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px 4px;
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--secondary-text-color);
      }
      .section-badge {
        background: var(--secondary-text-color);
        color: var(--card-background-color);
        border-radius: 8px;
        padding: 1px 6px;
        font-size: 10px;
      }

      .item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 16px;
        cursor: pointer;
        transition: background 0.15s;
      }
      .item:hover {
        background: color-mix(in srgb, var(--primary-text-color) 5%, transparent);
      }
      .section > .item:last-child {
        padding-bottom: 12px;
      }

      .item-icon {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .item-icon.update {
        background: none;
      }
      .item-icon.has-picture {
        border-radius: 0;
      }
      .item-icon ha-icon {
        --mdc-icon-size: 24px;
        color: var(--secondary-text-color);
      }
      .item-icon state-badge {
        --mdc-icon-size: 24px;
        width: 40px;
        height: 40px;
      }
      .item-icon.update ha-icon       { color: var(--info-color, var(--primary-color)); }
      .item-icon.notification ha-icon  { color: var(--warning-color, #ffa726); }
      .item-icon.repair ha-icon        { color: var(--error-color, #ef5350); }

      .item-content { flex: 1; min-width: 0; }
      .item-name {
        font-size: 14px;
        color: var(--primary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .item-secondary {
        font-size: 12px;
        color: var(--secondary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .item-trailing {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px; height: 24px;
      }
      .item-trailing ha-icon {
        --mdc-icon-size: 18px;
        color: var(--secondary-text-color);
      }

      .progress-ring {
        width: 24px; height: 24px;
        animation: spin 1.2s linear infinite;
      }
      .progress-ring svg { width: 100%; height: 100%; }
      .progress-ring circle {
        fill: none;
        stroke: var(--primary-color);
        stroke-width: 2.5;
        stroke-linecap: round;
        stroke-dasharray: 48;
        stroke-dashoffset: 16;
        transform-origin: center;
      }
      @keyframes spin { 100% { transform: rotate(360deg); } }

      .all-clear {
        padding: 24px 16px;
        text-align: center;
        color: var(--secondary-text-color);
        font-size: 14px;
      }
      .all-clear ha-icon {
        --mdc-icon-size: 48px;
        color: var(--success-color, #4caf50);
        display: block;
        margin: 0 auto 8px;
      }

      /* Individual layout */
      .individual-wrapper {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .individual-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 4px 4px;
        font-size: 16px;
        font-weight: 500;
        color: var(--primary-text-color);
      }
      .section-header.individual {
        background: transparent;
        padding: 8px 4px 4px;
        border-top: none;
      }
      ha-card.individual-card {
        overflow: hidden;
      }
      ha-card.individual-card .item {
        padding: 12px 16px;
      }
      ha-card.individual-card .item:hover {
        background: color-mix(in srgb, var(--primary-text-color) 5%, transparent);
      }
    `;
  }

  constructor() {
    super();
    this._repairs = [];
    this._notifications = [];
    this._repairsFetchedAt = 0;
    this._notificationsFetchedAt = 0;
  }

  static getConfigElement() {
    return document.createElement('system-notification-card-editor');
  }

  static getStubConfig() {
    return { title: 'System Notifications', show_section_headers: true, layout: 'single', section_order: DEFAULT_SECTIONS };
  }

  setConfig(config) {
    let sections = config.section_order;
    if (!sections) {
      sections = DEFAULT_SECTIONS.map(s => ({
        id: s.id,
        visible: config[`show_${s.id}`] !== false,
      }));
    }
    for (const def of DEFAULT_SECTIONS) {
      if (!sections.find(s => s.id === def.id)) {
        sections.push({ ...def });
      }
    }
    this._config = {
      section_order: sections,
      show_section_headers: config.show_section_headers !== false,
      title: config.title ?? '',
      layout: config.layout === 'individual' ? 'individual' : 'single',
    };
  }

  updated(changedProps) {
    if (changedProps.has('hass') && this.hass) {
      const vis = id => this._config?.section_order?.find(s => s.id === id)?.visible;
      if (vis('notifications') && Date.now() - this._notificationsFetchedAt > 10000) {
        this._fetchNotifications();
      }
      if (vis('repairs') && Date.now() - this._repairsFetchedAt > 30000) {
        this._fetchRepairs();
      }
    }
  }

  getCardSize() {
    const d = this._sectionData();
    return Math.max(2, 1 + Object.values(d).reduce((s, a) => s + a.length, 0));
  }

  getGridOptions() {
    return { rows: 'auto', columns: 12, min_rows: 2 };
  }

  // ── Data fetching ───────────────────────────────────────────────

  async _fetchRepairs() {
    this._repairsFetchedAt = Date.now();
    try {
      const result = await this.hass.callWS({ type: 'repairs/list_issues' });
      const repairs = (result.issues || []).filter(i => !i.ignored);
      const domains = [...new Set(repairs.map(r => r.domain))];
      let localize;
      for (const d of domains) {
        try { localize = await this.hass.loadBackendTranslation('issues', d); } catch (_) {}
      }
      if (localize) {
        for (const r of repairs) {
          const key = `component.${r.domain}.issues.${r.translation_key}.title`;
          r._resolvedTitle = localize(key, r.translation_placeholders || {}) || r.translation_key || r.domain;
        }
      }
      this._repairs = [...repairs];
    } catch (e) {
      console.warn('[system-notification-card] Failed to fetch repairs:', e);
    }
  }

  _getUpdates() {
    if (!this.hass) return [];
    return Object.entries(this.hass.states)
      .filter(([id, s]) => id.startsWith('update.') && s.state === 'on')
      .map(([id, s]) => ({
        entity_id: id,
        stateObj: s,
        friendly_name: s.attributes.friendly_name || id,
        title: s.attributes.title,
        installed_version: s.attributes.installed_version,
        latest_version: s.attributes.latest_version,
        in_progress: s.attributes.in_progress,
      }));
  }

  async _fetchNotifications() {
    this._notificationsFetchedAt = Date.now();
    try {
      const result = await this.hass.callWS({ type: 'persistent_notification/get' });
      this._notifications = [...(result || [])]
        .map(n => ({
          notification_id: n.notification_id,
          title: n.title || 'Notification',
          message: n.message || '',
          created_at: n.created_at,
        }))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (e) {
      console.warn('[system-notification-card] Failed to fetch notifications:', e);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────

  _getRepairTitle(r) {
    return r._resolvedTitle || r.translation_key || r.domain;
  }

  _sectionData() {
    return {
      updates:       this._getUpdates(),
      notifications: this._notifications,
      repairs:       this._repairs,
    };
  }

  // ── Rendering ───────────────────────────────────────────────────

  render() {
    if (!this._config || !this.hass) return html``;

    const allData = this._sectionData();
    const sections = this._config.section_order;
    const visibleData = {};
    for (const s of sections) {
      if (s.visible) visibleData[s.id] = allData[s.id] || [];
    }

    const totalCount = Object.values(visibleData).reduce((s, a) => s + a.length, 0);
    const showHeaders = this._config.show_section_headers;

    if (this._config.layout === 'individual') {
      return html`
        <div class="individual-wrapper">
          ${this._config.title ? html`
            <div class="individual-title">
              <span>${this._config.title}</span>
              ${totalCount > 0 ? html`<span class="badge">${totalCount}</span>` : ''}
            </div>` : ''}
          ${this._renderBodyIndividual(sections, visibleData, totalCount, showHeaders)}
        </div>
      `;
    }

    return html`
      <ha-card>
        ${this._config.title ? html`
          <div class="card-header">
            <span>${this._config.title}</span>
            ${totalCount > 0 ? html`<span class="badge">${totalCount}</span>` : ''}
          </div>` : ''}
        ${this._renderBodySingle(sections, visibleData, totalCount, showHeaders)}
      </ha-card>
    `;
  }

  _renderItem(sec, item) {
    if (sec.id === 'updates') {
      return html`
        <div class="item" @click=${() => this._fireMoreInfo(item.entity_id)}>
          <div class="item-icon update ${item.stateObj.attributes.entity_picture ? 'has-picture' : ''}">
            <state-badge
              .hass=${this.hass}
              .stateObj=${item.stateObj}
            ></state-badge>
          </div>
          <div class="item-content">
            <div class="item-name">${item.title || item.friendly_name}</div>
            <div class="item-secondary">${item.installed_version} → ${item.latest_version}</div>
          </div>
          <div class="item-trailing">
            ${item.in_progress
              ? html`<div class="progress-ring"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg></div>`
              : html`<ha-icon icon="mdi:chevron-right"></ha-icon>`}
          </div>
        </div>
      `;
    }

    if (sec.id === 'notifications') {
      return html`
        <div class="item" @click=${() => this._openNotificationDialog(item)}>
          <div class="item-icon notification">
            <ha-icon icon="mdi:bell"></ha-icon>
          </div>
          <div class="item-content">
            <div class="item-name">${item.title}</div>
            <div class="item-secondary">${item.message.length > 100 ? item.message.substring(0, 100) + '…' : item.message}</div>
          </div>
          <div class="item-trailing"><ha-icon icon="mdi:chevron-right"></ha-icon></div>
        </div>
      `;
    }

    if (sec.id === 'repairs') {
      return html`
        <div class="item" @click=${() => this._openRepairDialog(item)}>
          <div class="item-icon repair">
            <ha-icon icon="mdi:${item.severity === 'critical' ? 'alert-circle' : 'wrench'}"></ha-icon>
          </div>
          <div class="item-content">
            <div class="item-name">${this._getRepairTitle(item)}</div>
            <div class="item-secondary">${item.domain}${item.issue_domain ? ' · ' + item.issue_domain : ''}</div>
          </div>
          <div class="item-trailing"><ha-icon icon="mdi:chevron-right"></ha-icon></div>
        </div>
      `;
    }

    return '';
  }

  _renderSectionHeader(secId, count) {
    return html`
      <div class="section-header">
        <span>${t(this.hass, SECTION_KEYS[secId] || secId)}</span>
        <span class="section-badge">${count}</span>
      </div>
    `;
  }

  _renderBodySingle(sections, visibleData, totalCount, showHeaders) {
    if (totalCount === 0) {
      return html`
        <div class="all-clear">
          <ha-icon icon="mdi:check-circle-outline"></ha-icon>
          <div>${t(this.hass, 'All clear')}</div>
        </div>`;
    }

    return sections.filter(s => s.visible && (visibleData[s.id] || []).length > 0).map(sec => {
      const items = visibleData[sec.id];
      return html`
        <div class="section">
          ${showHeaders ? this._renderSectionHeader(sec.id, items.length) : ''}
          ${items.map(item => this._renderItem(sec, item))}
        </div>
      `;
    });
  }

  _renderBodyIndividual(sections, visibleData, totalCount, showHeaders) {
    if (totalCount === 0) {
      return html`
        <ha-card>
          <div class="all-clear">
            <ha-icon icon="mdi:check-circle-outline"></ha-icon>
            <div>${t(this.hass, 'All clear')}</div>
          </div>
        </ha-card>`;
    }

    return sections.filter(s => s.visible && (visibleData[s.id] || []).length > 0).map(sec => {
      const items = visibleData[sec.id];
      return html`
        ${showHeaders ? html`
          <div class="section-header individual">
            <span>${t(this.hass, SECTION_KEYS[sec.id] || sec.id)}</span>
            <span class="section-badge">${items.length}</span>
          </div>` : ''}
        ${items.map(item => html`
          <ha-card class="individual-card">${this._renderItem(sec, item)}</ha-card>
        `)}
      `;
    });
  }

  // ── Actions ────────────────────────────────────────────────────

  _fireMoreInfo(entityId) {
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      bubbles: true, composed: true,
      detail: { entityId },
    }));
  }

  _openNotificationDialog(notif) {
    const hass = this.hass;
    const dialog = document.createElement('ha-adaptive-dialog');
    dialog.hass = hass;
    dialog.headerTitle = notif.title;
    if (notif.created_at) {
      dialog.headerSubtitle = new Date(notif.created_at).toLocaleString();
    }

    const md = document.createElement('ha-markdown');
    md.breaks = true;
    md.content = notif.message;
    dialog.appendChild(md);

    const deleteBtn = document.createElement('ha-button');
    deleteBtn.slot = 'footer';
    deleteBtn.textContent = t(this.hass, 'Delete');
    dialog.appendChild(deleteBtn);

    document.body.appendChild(dialog);
    dialog.open = true;

    history.pushState({ dialog: 'notification' }, '');

    let closed = false;
    const closeDialog = () => {
      if (closed) return;
      closed = true;
      dialog.open = false;
      if (history.state?.dialog === 'notification') history.back();
    };

    const onPopState = () => {
      window.removeEventListener('popstate', onPopState);
      closeDialog();
    };
    window.addEventListener('popstate', onPopState);

    deleteBtn.addEventListener('click', () => {
      hass.callService('persistent_notification', 'dismiss', {
        notification_id: notif.notification_id,
      }).then(() => {
        this._notificationsFetchedAt = 0;
        this._fetchNotifications();
      });
      closeDialog();
    });

    const onClose = () => {
      closeDialog();
      window.removeEventListener('popstate', onPopState);
      dialog.remove();
    };
    dialog.addEventListener('closed', onClose);
    dialog.addEventListener('close', onClose);
  }

  async _openRepairDialog(issue) {
    if (!issue.is_fixable) {
      history.pushState(null, '', '/config/repairs');
      window.dispatchEvent(new Event('location-changed'));
      return;
    }

    const hass = this.hass;
    const tk = issue.translation_key || issue.issue_id;
    const ph = (step) => ({ ...(issue.translation_placeholders || {}), ...(step?.description_placeholders || {}) });

    await Promise.all([
      hass.loadBackendTranslation('issues', issue.domain).catch(() => {}),
      hass.loadBackendTranslation('selector', issue.domain).catch(() => {}),
    ]);

    let flow;
    try {
      flow = await hass.callApi('POST', 'repairs/issues/fix', {
        handler: issue.domain, issue_id: issue.issue_id,
      });
    } catch (_) {
      history.pushState(null, '', '/config/repairs');
      window.dispatchEvent(new Event('location-changed'));
      return;
    }

    const loc = (key, placeholders) => hass.localize(key, placeholders || {});
    const title = loc(`component.${issue.domain}.issues.${tk}.fix_flow.step.${flow.step_id}.title`, ph(flow))
      || this._getRepairTitle(issue);
    const desc = loc(`component.${issue.domain}.issues.${tk}.fix_flow.step.${flow.step_id}.description`, ph(flow)) || '';
    const submitLabel = loc(`component.${issue.domain}.issues.${tk}.fix_flow.step.${flow.step_id}.submit`)
      || loc('ui.panel.config.integrations.config_flow.submit') || 'OK';
    const severity = issue.severity === 'critical' ? 'error' : 'warning';
    const severityLabel = severity === 'error' ? t(this.hass, 'Critical') : t(this.hass, 'Warning');

    const dialog = document.createElement('ha-adaptive-dialog');
    dialog.hass = hass;
    dialog.headerTitle = title;
    dialog.headerSubtitle = `${severityLabel} · ${loc(`component.${issue.domain}.title`) || issue.domain}`;

    if (desc) {
      const md = document.createElement('ha-markdown');
      md.breaks = true;
      md.content = desc;
      dialog.appendChild(md);
    }

    const submitBtn = document.createElement('ha-button');
    submitBtn.slot = 'footer';
    submitBtn.textContent = submitLabel;
    dialog.appendChild(submitBtn);

    document.body.appendChild(dialog);
    dialog.open = true;

    history.pushState({ dialog: 'repair-flow' }, '');

    let submitted = false;
    let closed = false;

    const closeDialog = () => {
      if (closed) return;
      closed = true;
      dialog.open = false;
      if (!submitted) {
        hass.callApi('DELETE', `repairs/issues/fix/${flow.flow_id}`).catch(() => {});
      }
      if (history.state?.dialog === 'repair-flow') {
        history.back();
      }
    };

    const onPopState = () => {
      window.removeEventListener('popstate', onPopState);
      closeDialog();
    };
    window.addEventListener('popstate', onPopState);

    submitBtn.addEventListener('click', async () => {
      submitted = true;
      try {
        const result = await hass.callApi('POST', `repairs/issues/fix/${flow.flow_id}`, {});
        if (result.type === 'create_entry' || result.type === 'abort') {
          this._repairsFetchedAt = 0;
          this._fetchRepairs();
        }
      } catch (_) { /* ignore */ }
      closeDialog();
    });

    dialog.addEventListener('closed', () => {
      closeDialog();
      window.removeEventListener('popstate', onPopState);
      dialog.remove();
    });
    dialog.addEventListener('close', () => {
      closeDialog();
      window.removeEventListener('popstate', onPopState);
      dialog.remove();
    });
  }
}

// ── Editor ──────────────────────────────────────────────────────────
class SystemNotificationCardEditor extends LitElement {

  static get properties() {
    return {
      hass:    { attribute: false },
      _config: { state: true },
    };
  }

  static get styles() {
    return css`
      :host { display: block; }
      .field { margin-bottom: 16px; }
      .field label {
        display: block;
        font-size: 12px;
        font-weight: 500;
        color: var(--secondary-text-color);
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.4px;
      }

      .section-list {
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        overflow: hidden;
      }
      .section-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        background: var(--card-background-color);
        transition: background 0.15s;
        cursor: grab;
        user-select: none;
      }
      .section-item:active { cursor: grabbing; }
      .section-item + .section-item {
        border-top: 1px solid var(--divider-color);
      }
      .section-item.drag-over {
        border-top: 2px solid var(--primary-color);
      }
      .section-item.dragging {
        opacity: 0.4;
      }
      .drag-handle {
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
      }
      .drag-handle ha-icon {
        --mdc-icon-size: 20px;
      }
      .section-name {
        flex: 1;
        font-size: 14px;
        color: var(--primary-text-color);
      }
      .section-name.hidden {
        color: var(--secondary-text-color);
        text-decoration: line-through;
      }
      .vis-toggle {
        cursor: pointer;
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
      }
      .vis-toggle.on { color: var(--primary-color); }
      .vis-toggle ha-icon { --mdc-icon-size: 22px; }

      .layout-select {
        display: flex;
        gap: 8px;
      }
      .layout-option {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 12px 8px;
        border: 2px solid var(--divider-color);
        border-radius: 12px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s;
        font-size: 12px;
      }
      .layout-option:hover {
        border-color: var(--primary-color);
      }
      .layout-option.active {
        border-color: var(--primary-color);
        background: color-mix(in srgb, var(--primary-color) 10%, transparent);
      }
      .layout-option ha-icon {
        --mdc-icon-size: 28px;
        color: var(--secondary-text-color);
      }
      .layout-option.active ha-icon {
        color: var(--primary-color);
      }
    `;
  }

  setConfig(config) {
    this._config = { ...config };
    if (!this._config.section_order) {
      this._config.section_order = DEFAULT_SECTIONS.map(s => ({
        id: s.id,
        visible: config[`show_${s.id}`] !== false,
      }));
    }
  }

  render() {
    if (!this._config) return html``;
    const c = this._config;
    const sections = c.section_order || DEFAULT_SECTIONS;

    const formData = {
      title: c.title || '',
      show_section_headers: c.show_section_headers !== false,
    };
    const computeLabel = (s) => t(this.hass, EDITOR_LABELS[s.name] ?? s.name);

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${formData}
        .schema=${EDITOR_SCHEMA}
        .computeLabel=${computeLabel}
        @value-changed=${this._onFormValueChanged}
      ></ha-form>

      <div class="field">
        <label>${t(this.hass, 'Layout')}</label>
        <div class="layout-select">
          <button class="layout-option ${(c.layout || 'single') === 'single' ? 'active' : ''}"
                  @click=${() => this._setLayout('single')}>
            <ha-icon icon="mdi:card-outline"></ha-icon>
            <span>${t(this.hass, 'Single Card')}</span>
          </button>
          <button class="layout-option ${c.layout === 'individual' ? 'active' : ''}"
                  @click=${() => this._setLayout('individual')}>
            <ha-icon icon="mdi:view-agenda-outline"></ha-icon>
            <span>${t(this.hass, 'Individual Items')}</span>
          </button>
        </div>
      </div>

      <div class="field">
        <label>${t(this.hass, 'Sections (Drag & Drop to reorder)')}</label>
        <div class="section-list">
          ${sections.map((s, i) => html`
            <div class="section-item" draggable="true" data-index="${i}"
                 @dragstart=${this._onDragStart} @dragend=${this._onDragEnd}
                 @dragover=${this._onDragOver} @dragleave=${this._onDragLeave}
                 @drop=${this._onDrop}>
              <div class="drag-handle"><ha-icon icon="mdi:drag"></ha-icon></div>
              <span class="section-name ${s.visible ? '' : 'hidden'}">${t(this.hass, SECTION_KEYS[s.id] || s.id)}</span>
              <div class="vis-toggle ${s.visible ? 'on' : ''}"
                   @click=${(e) => this._toggleVisibility(e, i)}
                   title="${s.visible ? t(this.hass, 'Hide') : t(this.hass, 'Show')}">
                <ha-icon icon="mdi:${s.visible ? 'eye' : 'eye-off'}"></ha-icon>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  _onFormValueChanged(e) {
    this._config = { ...this._config, ...e.detail.value };
    this._fireChanged();
  }

  _setLayout(layout) {
    this._config = { ...this._config, layout };
    this._fireChanged();
  }

  _toggleVisibility(e, idx) {
    e.stopPropagation();
    const sections = [...this._config.section_order];
    sections[idx] = { ...sections[idx], visible: !sections[idx].visible };
    this._config = { ...this._config, section_order: sections };
    this._fireChanged();
  }

  _onDragStart(e) {
    this._dragSrc = parseInt(e.currentTarget.dataset.index, 10);
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  _onDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    this.shadowRoot.querySelectorAll('.section-item').forEach(i => i.classList.remove('drag-over'));
  }

  _onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.shadowRoot.querySelectorAll('.section-item').forEach(i => i.classList.remove('drag-over'));
    e.currentTarget.classList.add('drag-over');
  }

  _onDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
  }

  _onDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const from = this._dragSrc;
    const to = parseInt(e.currentTarget.dataset.index, 10);
    if (from === to) return;

    const sections = [...this._config.section_order];
    const [moved] = sections.splice(from, 1);
    sections.splice(to, 0, moved);
    this._config = { ...this._config, section_order: sections };
    this._fireChanged();
  }

  _fireChanged() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: { ...this._config } },
      bubbles: true, composed: true,
    }));
  }
}

// ── Registration ────────────────────────────────────────────────────
customElements.define('system-notification-card', SystemNotificationCard);
customElements.define('system-notification-card-editor', SystemNotificationCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.find(c => c.type === 'system-notification-card')) {
  window.customCards.push({
    type:        'system-notification-card',
    name:        'System Notification Card',
    description: 'Shows updates, notifications, and repairs in a compact overview.',
    preview:     true,
  });
}

console.info(
  `%c SYSTEM-NOTIFICATION-CARD %c v${SYSTEM_NOTIFICATION_CARD_VERSION} `,
  'background:#2196F3;color:#fff;font-weight:bold;',
  'background:#ddd;color:#333;',
);
