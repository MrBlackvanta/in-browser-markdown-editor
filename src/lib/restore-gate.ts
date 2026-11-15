import { WORKSPACE_STORAGE_KEY } from "./workspace";

export const RESTORE_GATE_TIMEOUT = 3000;

export const RESTORE_GATE_SCRIPT = `try{if(localStorage.getItem("${WORKSPACE_STORAGE_KEY}")!==null){const root=document.documentElement;root.dataset.restoring="";setTimeout(()=>root.removeAttribute("data-restoring"),${RESTORE_GATE_TIMEOUT})}}catch{}`;

export function openRestoreGate() {
  document.documentElement.removeAttribute("data-restoring");
}
