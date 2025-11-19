/**
 * User menu component
 * Displays user info and account actions
 */

import type { UserProfile } from '../../../lib/auth/session.js';
import type { StorageQuota } from '../../../lib/cloud/sync.js';

export class UserMenu {
  private element: HTMLElement;
  private dropdownOpen = false;
  private onLogout: () => void;
  private onViewFiles: () => void;
  private storageQuota: StorageQuota | null = null;

  constructor(
    private user: UserProfile,
    onLogout: () => void,
    onViewFiles: () => void,
    storageQuota: StorageQuota | null = null
  ) {
    this.onLogout = onLogout;
    this.onViewFiles = onViewFiles;
    this.storageQuota = storageQuota;
    this.element = this.createElement();
  }

  private createElement(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'user-menu';
    container.style.cssText = `
      position: relative;
      display: inline-block;
    `;

    // User button
    const button = document.createElement('button');
    button.className = 'user-menu-button';
    button.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      border: none;
      border-radius: 6px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    `;

    const avatar = document.createElement('div');
    avatar.style.cssText = `
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: white;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 12px;
    `;
    avatar.textContent = this.user.email.charAt(0).toUpperCase();

    const email = document.createElement('span');
    email.textContent = this.user.email;
    email.style.cssText = 'max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';

    button.appendChild(avatar);
    button.appendChild(email);

    // Dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'user-menu-dropdown';
    dropdown.style.cssText = `
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 8px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      min-width: 250px;
      display: none;
      z-index: 1000;
    `;

    dropdown.innerHTML = this.getDropdownContent();

    button.addEventListener('click', () => this.toggleDropdown());

    container.appendChild(button);
    container.appendChild(dropdown);

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target as Node)) {
        this.closeDropdown();
      }
    });

    // Attach dropdown event listeners
    setTimeout(() => this.attachDropdownListeners(), 0);

    return container;
  }

  private getDropdownContent(): string {
    const quota = this.storageQuota ?? {
      used: this.user.storage_used_bytes,
      quota: this.user.storage_quota_bytes,
      percentUsed: Math.round(
        (this.user.storage_used_bytes / this.user.storage_quota_bytes) * 100
      ),
    };

    const usedGB = this.formatBytes(quota.used);
    const quotaGB = this.formatBytes(quota.quota);
    const percentUsed = Math.min(100, Math.round(quota.percentUsed));
    const remaining = Math.max(quota.quota - quota.used, 0);
    const remainingText = this.formatBytes(remaining, true) + ' left';

    return `
      <div style="padding: 16px; border-bottom: 1px solid #e0e0e0;">
        <div style="font-weight: 600; color: #1a1a1a; margin-bottom: 4px;">
          ${this.user.email}
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 12px; color: #666;">Signed in</span>
          <span class="quota-pill" style="font-size: 12px; padding: 4px 8px; border: 2px solid #111; border-radius: 999px; background: #fef3c7; color: #111; font-weight: 700; letter-spacing: -0.01em; box-shadow: 4px 4px 0 #111;">
            ${remainingText}
          </span>
        </div>
      </div>

      <div style="padding: 16px; border-bottom: 1px solid #e0e0e0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 13px; color: #666;">Storage</span>
          <span style="font-size: 13px; font-weight: 500; color: #1a1a1a;">
            ${usedGB} / ${quotaGB} GB
          </span>
        </div>
        <div class="storage-progress brutalist" style="width: 100%; height: 10px; background: #fff; border: 2px solid #111; border-radius: 6px; overflow: hidden; box-shadow: 4px 4px 0 #111;">
          <div style="width: ${percentUsed}%; height: 100%; background: linear-gradient(90deg, #111827 0%, #fb7185 100%);"></div>
        </div>
      </div>

      <div style="padding: 8px;">
        <button
          class="menu-item menu-files"
          style="width: 100%; padding: 10px 12px; background: none; border: none; text-align: left; border-radius: 6px; cursor: pointer; font-size: 14px; color: #1a1a1a; transition: background 0.2s; display: flex; align-items: center; gap: 8px;"
        >
          <span>📁</span>
          <span>My Files</span>
        </button>
        <button
          class="menu-item menu-logout"
          style="width: 100%; padding: 10px 12px; background: none; border: none; text-align: left; border-radius: 6px; cursor: pointer; font-size: 14px; color: #dc2626; transition: background 0.2s; display: flex; align-items: center; gap: 8px;"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    `;
  }

  private attachDropdownListeners(): void {
    const filesButton = this.element.querySelector('.menu-files');
    const logoutButton = this.element.querySelector('.menu-logout');

    filesButton?.addEventListener('click', () => {
      this.onViewFiles();
      this.closeDropdown();
    });

    logoutButton?.addEventListener('click', () => {
      this.onLogout();
      this.closeDropdown();
    });

    // Hover effects
    this.element.querySelectorAll('.menu-item').forEach((item) => {
      item.addEventListener('mouseenter', () => {
        (item as HTMLElement).style.background = '#f5f5f5';
      });
      item.addEventListener('mouseleave', () => {
        (item as HTMLElement).style.background = 'none';
      });
    });
  }

  private toggleDropdown(): void {
    const dropdown = this.element.querySelector('.user-menu-dropdown') as HTMLElement;
    this.dropdownOpen = !this.dropdownOpen;
    dropdown.style.display = this.dropdownOpen ? 'block' : 'none';
  }

  private closeDropdown(): void {
    const dropdown = this.element.querySelector('.user-menu-dropdown') as HTMLElement;
    this.dropdownOpen = false;
    dropdown.style.display = 'none';
  }

  updateUser(user: UserProfile): void {
    this.user = user;
    const container = this.element;
    const newElement = this.createElement();
    container.replaceWith(newElement);
    this.element = newElement;
  }

  updateQuota(quota: StorageQuota): void {
    this.storageQuota = quota;
    const container = this.element;
    const newElement = this.createElement();
    container.replaceWith(newElement);
    this.element = newElement;
  }

  private formatBytes(bytes: number, short: boolean = false): string {
    const gb = bytes / (1024 * 1024 * 1024);
    const mb = bytes / (1024 * 1024);

    if (gb >= 0.1) {
      return short ? `${gb.toFixed(1)} GB` : `${gb.toFixed(2)}`;
    }

    return short ? `${mb.toFixed(0)} MB` : `${mb.toFixed(1)}`;
  }

  getElement(): HTMLElement {
    return this.element;
  }
}
