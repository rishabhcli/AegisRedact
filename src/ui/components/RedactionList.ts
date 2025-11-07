import type { Box } from '../../lib/pdf/find';
import type { EnhancedBox, AuditStats, PIIType } from '../../lib/detect/types';

/**
 * Redaction list component showing found matches
 */

export interface RedactionItem extends EnhancedBox {
  id: string;
  enabled: boolean;
}

export class RedactionList {
  private element: HTMLDivElement;
  private items: RedactionItem[] = [];
  private auditStats: AuditStats | null = null;
  private currentFilter: PIIType | 'all' = 'all';
  private isAuditCollapsed: boolean = false;
  private onChange: (items: RedactionItem[]) => void;

  constructor(onChange: (items: RedactionItem[]) => void) {
    this.onChange = onChange;
    this.element = this.createList();
  }

  private createList(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'redaction-list';
    container.innerHTML = `
      <div class="audit-summary"></div>
      <h3 class="redaction-list-title">Detections (0)</h3>
    `;
    return container;
  }

  setAuditStats(stats: AuditStats | null): void {
    this.auditStats = stats;
    this.renderAuditSummary();
  }

  setItems(boxes: EnhancedBox[]) {
    this.items = boxes.map((box, index) => ({
      ...box,
      id: `detection-${index}`,
      enabled: true
    }));
    this.render();
  }

  private render() {
    // Filter items based on current filter
    const filteredItems = this.currentFilter === 'all'
      ? this.items
      : this.items.filter(item => item.type === this.currentFilter);

    const title = `Detections (${filteredItems.length}${this.currentFilter !== 'all' ? ` of ${this.items.length}` : ''})`;
    this.element.querySelector('.redaction-list-title')!.textContent = title;

    // Remove old content (both list and empty message)
    const oldList = this.element.querySelector('.redaction-list-items');
    if (oldList) oldList.remove();

    const oldEmpty = this.element.querySelector('.redaction-list-empty');
    if (oldEmpty) oldEmpty.remove();

    if (filteredItems.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'redaction-list-empty';
      empty.textContent = this.items.length === 0
        ? 'No detections found. Draw boxes manually to redact areas.'
        : 'No detections match the current filter.';
      this.element.appendChild(empty);
      return;
    }

    const list = document.createElement('ul');
    list.className = 'redaction-list-items';

    filteredItems.forEach((item) => {
      const li = this.createListItem(item);
      list.appendChild(li);
    });

    this.element.appendChild(list);
  }

  private createListItem(item: RedactionItem): HTMLLIElement {
    const li = document.createElement('li');
    li.className = `redaction-list-item type-${item.type}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = item.enabled;
    checkbox.id = item.id;
    checkbox.addEventListener('change', () => {
      item.enabled = checkbox.checked;
      this.onChange(this.items);
    });

    const content = document.createElement('div');
    content.className = 'item-content';

    const textDiv = document.createElement('div');
    textDiv.className = 'item-text';
    textDiv.textContent = item.text.substring(0, 40);
    if (item.text.length > 40) {
      textDiv.textContent += '...';
    }

    const metaDiv = document.createElement('div');
    metaDiv.className = 'item-meta';
    const icon = this.getTypeIcon(item.type);
    const label = this.getTypeLabel(item.type);
    const confidence = item.confidence && item.detectionMethod === 'ml'
      ? ` (${(item.confidence * 100).toFixed(0)}%)`
      : '';
    metaDiv.textContent = `${icon} ${label}${confidence} • Page ${item.pageNumber}`;

    content.appendChild(textDiv);
    content.appendChild(metaDiv);

    li.appendChild(checkbox);
    li.appendChild(content);

    return li;
  }

  getEnabledBoxes(): Box[] {
    return this.items.filter((item) => item.enabled);
  }

  private renderAuditSummary(): void {
    const summaryEl = this.element.querySelector('.audit-summary') as HTMLElement;
    if (!summaryEl) return;

    if (!this.auditStats || this.auditStats.total === 0) {
      summaryEl.innerHTML = '';
      summaryEl.style.display = 'none';
      return;
    }

    summaryEl.style.display = 'block';
    summaryEl.innerHTML = `
      <div class="audit-header">
        <h3>📊 Redaction Summary</h3>
        <button class="collapse-btn" aria-label="Toggle summary">${this.isAuditCollapsed ? '+' : '−'}</button>
      </div>
      <div class="audit-stats" style="display: ${this.isAuditCollapsed ? 'none' : 'block'}">
        <div class="stat-row total">
          <span>Total Redactions:</span>
          <strong>${this.auditStats.total}</strong>
        </div>
        <div class="stat-row">
          <span>Across Pages:</span>
          <strong>${this.auditStats.pagesAffected}</strong>
        </div>
        <hr>
        ${this.renderTypeBreakdown()}
        <hr>
        <div class="stat-row">
          <span>Detection Method:</span>
          <span>${this.formatDetectionMethods()}</span>
        </div>
      </div>
      <select class="filter-dropdown" aria-label="Filter by type">
        <option value="all">All Types (${this.auditStats.total})</option>
        ${this.renderFilterOptions()}
      </select>
    `;

    this.attachAuditListeners();
  }

  private renderTypeBreakdown(): string {
    if (!this.auditStats) return '';

    const typeEntries = Object.entries(this.auditStats.byType)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => {
        const icon = this.getTypeIcon(type as PIIType);
        const label = this.getTypeLabel(type as PIIType);
        return `
          <div class="stat-row type-${type}">
            <span>${icon} ${label}s:</span>
            <strong>${count}</strong>
          </div>
        `;
      });

    return typeEntries.join('');
  }

  private renderFilterOptions(): string {
    if (!this.auditStats) return '';

    return Object.entries(this.auditStats.byType)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => {
        const icon = this.getTypeIcon(type as PIIType);
        const label = this.getTypeLabel(type as PIIType);
        return `<option value="${type}">${icon} ${label}s (${count})</option>`;
      })
      .join('');
  }

  private formatDetectionMethods(): string {
    if (!this.auditStats) return '';

    const methodLabels = {
      'regex': 'Regex',
      'ml': 'ML',
      'manual': 'Manual'
    };

    return this.auditStats.methodsUsed
      .map(method => methodLabels[method] || method)
      .join(' + ');
  }

  private attachAuditListeners(): void {
    const collapseBtn = this.element.querySelector('.collapse-btn');
    collapseBtn?.addEventListener('click', () => {
      this.isAuditCollapsed = !this.isAuditCollapsed;
      this.renderAuditSummary();
    });

    const filterDropdown = this.element.querySelector('.filter-dropdown') as HTMLSelectElement;
    filterDropdown?.addEventListener('change', (e) => {
      this.currentFilter = (e.target as HTMLSelectElement).value as PIIType | 'all';
      this.render();
    });
  }

  private getTypeIcon(type: PIIType | string): string {
    const icons: Record<string, string> = {
      'email': '📧',
      'phone': '📞',
      'ssn': '🔢',
      'card': '💳',
      'name': '👤',
      'org': '🏢',
      'location': '📍',
      'manual': '✏️'
    };
    return icons[type] || '📄';
  }

  private getTypeLabel(type: PIIType | string): string {
    const labels: Record<string, string> = {
      'email': 'Email',
      'phone': 'Phone',
      'ssn': 'SSN',
      'card': 'Card',
      'name': 'Name',
      'org': 'Organization',
      'location': 'Location',
      'manual': 'Manual'
    };
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
  }

  getElement(): HTMLDivElement {
    return this.element;
  }
}
