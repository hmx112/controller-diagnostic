import { BrowserGamepadProvider } from '../core/browserProvider.js';
import { ControllerEngine, type ControllerEngineState } from '../core/controllerEngine.js';
import type { ControllerSnapshot } from '../core/types.js';
import { centerDeviation } from '../diagnostics/centerDeviation.js';
import { CircularitySession } from '../diagnostics/circularity.js';
import { DeadzoneSession } from '../diagnostics/deadzone.js';
import { StickRangeSession } from '../diagnostics/stickRange.js';
import { rawAxisLabel, rawButtonLabel } from '../mapping/raw.js';
import { STANDARD_BUTTON_LABELS } from '../mapping/standard.js';

type StickName = 'left' | 'right';

interface StickSessions {
  range: StickRangeSession;
  rangeActive: boolean;
  circularity: CircularitySession;
  circularityActive: boolean;
  deadzone: DeadzoneSession;
}

const DISCLAIMER = 'Results reflect input values exposed by your browser and operating system and may differ from raw hardware measurements.';
void DISCLAIMER;

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing UI element: ${id}`);
  return element as T;
}

const elements = {
  statusDot: byId<HTMLElement>('status-dot'),
  connectionStatus: document.querySelector<HTMLElement>('[data-testid="connection-status"]')!,
  connectionDetail: byId<HTMLElement>('connection-detail'),
  controllerPicker: byId<HTMLElement>('controller-picker'),
  controllerSelect: byId<HTMLSelectElement>('controller-select'),
  browserWarning: byId<HTMLElement>('browser-support-warning'),
  liveTool: byId<HTMLElement>('live-tool'),
  controllerName: byId<HTMLElement>('controller-name'),
  controllerCount: byId<HTMLElement>('controller-count'),
  modeBadge: byId<HTMLElement>('mode-badge'),
  profileId: byId<HTMLElement>('profile-id'),
  inputCounts: byId<HTMLElement>('input-counts'),
  buttonGrid: byId<HTMLElement>('button-grid'),
  triggerL2: byId<HTMLElement>('trigger-l2'),
  triggerR2: byId<HTMLElement>('trigger-r2'),
  leftStick: byId<HTMLElement>('left-stick'),
  rightStick: byId<HTMLElement>('right-stick'),
  leftStickValue: byId<HTMLOutputElement>('left-stick-value'),
  rightStickValue: byId<HTMLOutputElement>('right-stick-value'),
  stickModeHint: byId<HTMLElement>('stick-mode-hint'),
  rawInput: byId<HTMLElement>('raw-input'),
  controllerInfo: byId<HTMLElement>('controller-info'),
  centerLeft: byId<HTMLOutputElement>('center-left'),
  centerRight: byId<HTMLOutputElement>('center-right'),
  rangeLeft: byId<HTMLOutputElement>('range-left'),
  rangeRight: byId<HTMLOutputElement>('range-right'),
  circularityLeft: byId<HTMLOutputElement>('circularity-left'),
  circularityRight: byId<HTMLOutputElement>('circularity-right'),
  deadzoneLeft: byId<HTMLOutputElement>('deadzone-left'),
  deadzoneRight: byId<HTMLOutputElement>('deadzone-right'),
};

function createStickSessions(): StickSessions {
  return {
    range: new StickRangeSession(),
    rangeActive: false,
    circularity: new CircularitySession(),
    circularityActive: false,
    deadzone: new DeadzoneSession(),
  };
}

const sessions: Record<StickName, StickSessions> = {
  left: createStickSessions(),
  right: createStickSessions(),
};

let lastSelectedIndex: number | null = null;
let selectorSignature = '';
let animationFrame = 0;

function resetSessions(): void {
  for (const stick of ['left', 'right'] as const) {
    sessions[stick].range.reset();
    sessions[stick].rangeActive = false;
    sessions[stick].circularity.reset();
    sessions[stick].circularityActive = false;
    sessions[stick].deadzone.reset();
  }
}

function selectedController(state: ControllerEngineState): ControllerSnapshot | null {
  if (state.selectedIndex === null) return null;
  return state.controllers.find((controller) => controller.identity.index === state.selectedIndex) ?? null;
}

function formatValue(value: number): string {
  return value.toFixed(3);
}

function formatPercent(value: number | null, digits = 1): string {
  return value === null ? '—' : `${value.toFixed(digits)}%`;
}

function renderSelector(state: ControllerEngineState): void {
  const signature = state.controllers.map((controller) => `${controller.identity.index}:${controller.identity.id}`).join('|');
  if (signature !== selectorSignature) {
    elements.controllerSelect.replaceChildren(...state.controllers.map((controller) => {
      const option = document.createElement('option');
      option.value = String(controller.identity.index);
      option.textContent = `#${controller.identity.index} · ${controller.identity.id || 'Unnamed controller'}`;
      return option;
    }));
    selectorSignature = signature;
  }

  elements.controllerPicker.hidden = state.controllers.length === 0;
  if (state.selectedIndex !== null) elements.controllerSelect.value = String(state.selectedIndex);
}

function renderButtonGrid(controller: ControllerSnapshot): void {
  const standard = controller.capabilities.standardMapping;
  const fragment = document.createDocumentFragment();

  controller.buttons.forEach((button) => {
    const cell = document.createElement('div');
    cell.className = `button-cell${button.pressed ? ' is-pressed' : ''}`;
    cell.dataset.buttonIndex = String(button.index);
    const label = standard ? (STANDARD_BUTTON_LABELS[button.index] ?? `Button ${button.index}`) : rawButtonLabel(button.index);
    cell.innerHTML = `<span>${label}</span><strong>${button.value.toFixed(3)}</strong>`;
    fragment.append(cell);
  });

  elements.buttonGrid.replaceChildren(fragment);
}

function renderTrigger(element: HTMLElement, value: number | null, unavailable = false): void {
  const fill = element.querySelector<HTMLElement>('.meter-fill');
  const output = element.querySelector<HTMLOutputElement>('output');
  if (!fill || !output) return;

  if (unavailable || value === null) {
    fill.style.width = '0%';
    output.textContent = 'Raw mode';
    return;
  }

  const clamped = Math.max(0, Math.min(1, value));
  fill.style.width = `${clamped * 100}%`;
  output.textContent = value.toFixed(3);
}

function renderStick(element: HTMLElement, output: HTMLOutputElement, x: number | null, y: number | null): void {
  const dot = element.querySelector<HTMLElement>('.stick-dot');
  if (!dot) return;

  if (x === null || y === null) {
    element.dataset.x = '';
    element.dataset.y = '';
    dot.style.left = '50%';
    dot.style.top = '50%';
    output.textContent = 'Raw mode';
    element.classList.add('is-unavailable');
    return;
  }

  element.classList.remove('is-unavailable');
  element.dataset.x = x.toFixed(3);
  element.dataset.y = y.toFixed(3);
  dot.style.left = `${Math.max(0, Math.min(100, (x + 1) * 50))}%`;
  dot.style.top = `${Math.max(0, Math.min(100, (y + 1) * 50))}%`;
  output.textContent = `X ${formatValue(x)} · Y ${formatValue(y)}`;
}

function updateSession(stick: StickName, x: number, y: number): void {
  const state = sessions[stick];
  if (state.rangeActive) state.range.addSample(x, y);
  if (state.circularityActive) state.circularity.addSample(x, y);
  if (state.deadzone.result().active) state.deadzone.addSample(x, y);
}

function renderDiagnosticOutputs(stick: StickName, x: number | null, y: number | null): void {
  const centerOutput = stick === 'left' ? elements.centerLeft : elements.centerRight;
  const rangeOutput = stick === 'left' ? elements.rangeLeft : elements.rangeRight;
  const circularityOutput = stick === 'left' ? elements.circularityLeft : elements.circularityRight;
  const deadzoneOutput = stick === 'left' ? elements.deadzoneLeft : elements.deadzoneRight;

  if (x === null || y === null) {
    centerOutput.textContent = 'Unavailable in Raw Input Mode';
    rangeOutput.textContent = 'Unavailable in Raw Input Mode';
    circularityOutput.textContent = 'Unavailable in Raw Input Mode';
    deadzoneOutput.textContent = 'Unavailable in Raw Input Mode';
    return;
  }

  const center = centerDeviation(x, y);
  centerOutput.textContent = `Browser-observed ${formatPercent(center.percent)}`;
  updateSession(stick, x, y);

  const range = sessions[stick].range.result();
  rangeOutput.textContent = range.sampleCount === 0
    ? (sessions[stick].rangeActive ? 'Measuring…' : 'Not started')
    : `${formatPercent(range.maxRadialPercent)} max observed`;

  const circularity = sessions[stick].circularity.result();
  circularityOutput.textContent = circularity.sampleCount === 0
    ? (sessions[stick].circularityActive ? 'Move around the perimeter…' : 'Not started')
    : `${formatPercent(circularity.scorePercent)} score · ${formatPercent((circularity.radialSpread ?? 0) * 100)} spread`;

  const deadzone = sessions[stick].deadzone.result();
  if (!deadzone.active) {
    deadzoneOutput.textContent = 'Not started';
  } else if (deadzone.firstThresholdMagnitude === null) {
    deadzoneOutput.textContent = 'Measuring — move slowly from center';
  } else {
    deadzoneOutput.textContent = `Input exceeded 2% threshold near ${formatPercent(deadzone.firstThresholdMagnitude * 100)}`;
  }
}

function renderRawInput(controller: ControllerSnapshot): void {
  const axisItems = controller.axes.map((axis) => `<div><span>${rawAxisLabel(axis.index)}</span><strong>${axis.value.toFixed(4)}</strong></div>`).join('');
  const buttonItems = controller.buttons.map((button) => `<div><span>${rawButtonLabel(button.index)}</span><strong>${button.value.toFixed(4)}${button.pressed ? ' · pressed' : ''}</strong></div>`).join('');
  elements.rawInput.innerHTML = `<section><h3>Axes</h3>${axisItems || '<p>No axes exposed.</p>'}</section><section><h3>Buttons</h3>${buttonItems || '<p>No buttons exposed.</p>'}</section>`;
}

function renderInfo(controller: ControllerSnapshot): void {
  const rows = [
    ['ID', controller.identity.id || 'Not provided'],
    ['Index', String(controller.identity.index)],
    ['Mapping', controller.identity.mapping || '(none / raw)'],
    ['Buttons', String(controller.capabilities.buttonCount)],
    ['Axes', String(controller.capabilities.axisCount)],
    ['Timestamp', String(controller.identity.timestamp)],
  ];
  elements.controllerInfo.innerHTML = rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
}

function renderEmpty(): void {
  elements.statusDot.classList.remove('is-connected');
  elements.connectionStatus.textContent = 'Connect a controller and press any button';
  elements.connectionDetail.textContent = 'The browser will list controllers it can expose through the Gamepad API.';
  elements.liveTool.hidden = true;
  elements.controllerPicker.hidden = true;
}

function renderController(controller: ControllerSnapshot, state: ControllerEngineState): void {
  const standard = controller.capabilities.standardMapping;
  elements.statusDot.classList.add('is-connected');
  elements.connectionStatus.textContent = 'Controller detected';
  elements.connectionDetail.textContent = state.controllers.length > 1 ? `${state.controllers.length} controllers detected — choose one to inspect.` : 'Live browser-observed values are updating below.';
  elements.liveTool.hidden = false;
  elements.controllerName.textContent = controller.identity.id || 'Unnamed controller';
  elements.controllerCount.textContent = state.controllers.length === 1 ? '1 controller detected' : `${state.controllers.length} controllers detected`;
  elements.modeBadge.textContent = standard ? 'Standard Mapping' : 'Raw Input Mode';
  elements.modeBadge.classList.toggle('is-raw', !standard);
  elements.profileId.textContent = `Profile: ${controller.capabilities.profileId}`;
  elements.inputCounts.textContent = `${controller.capabilities.buttonCount} buttons · ${controller.capabilities.axisCount} axes`;

  renderButtonGrid(controller);
  renderTrigger(elements.triggerL2, standard ? (controller.buttons[6]?.value ?? null) : null, !standard);
  renderTrigger(elements.triggerR2, standard ? (controller.buttons[7]?.value ?? null) : null, !standard);

  const leftX = standard ? (controller.axes[0]?.value ?? 0) : null;
  const leftY = standard ? (controller.axes[1]?.value ?? 0) : null;
  const rightX = standard ? (controller.axes[2]?.value ?? 0) : null;
  const rightY = standard ? (controller.axes[3]?.value ?? 0) : null;
  elements.stickModeHint.textContent = standard ? 'Standard mapping axes 0–3' : 'Stick roles are not inferred in Raw Input Mode';
  renderStick(elements.leftStick, elements.leftStickValue, leftX, leftY);
  renderStick(elements.rightStick, elements.rightStickValue, rightX, rightY);
  renderDiagnosticOutputs('left', leftX, leftY);
  renderDiagnosticOutputs('right', rightX, rightY);
  renderRawInput(controller);
  renderInfo(controller);

  document.querySelectorAll<HTMLButtonElement>('[data-session-action]').forEach((button) => {
    button.disabled = !standard;
  });
}

function handleSessionAction(action: string, stick: StickName): void {
  const state = sessions[stick];
  if (action === 'start-range') {
    state.range.reset();
    state.rangeActive = true;
  } else if (action === 'reset-range') {
    state.range.reset();
    state.rangeActive = false;
  } else if (action === 'start-circularity') {
    state.circularity.reset();
    state.circularityActive = true;
  } else if (action === 'reset-circularity') {
    state.circularity.reset();
    state.circularityActive = false;
  } else if (action === 'start-deadzone') {
    state.deadzone.start(0.02);
  } else if (action === 'reset-deadzone') {
    state.deadzone.reset();
  }
}

if (typeof navigator.getGamepads !== 'function') {
  elements.browserWarning.hidden = false;
  renderEmpty();
} else {
  const provider = new BrowserGamepadProvider();
  const engine = new ControllerEngine(provider);

  elements.controllerSelect.addEventListener('change', () => {
    engine.select(Number(elements.controllerSelect.value));
  });

  document.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-session-action]');
    if (!target) return;
    const stick = target.dataset.stick;
    const action = target.dataset.sessionAction;
    if ((stick === 'left' || stick === 'right') && action) handleSessionAction(action, stick);
  });

  const frame = () => {
    const state = engine.scan();
    renderSelector(state);
    if (state.selectedIndex !== lastSelectedIndex) {
      resetSessions();
      lastSelectedIndex = state.selectedIndex;
    }
    const controller = selectedController(state);
    if (controller) renderController(controller, state);
    else renderEmpty();
    animationFrame = requestAnimationFrame(frame);
  };

  frame();

  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(animationFrame);
    engine.dispose();
    provider.dispose();
  }, { once: true });
}
