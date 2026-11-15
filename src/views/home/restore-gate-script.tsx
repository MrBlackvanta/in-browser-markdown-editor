import { RESTORE_GATE_SCRIPT } from "@/lib/restore-gate";

export default function RestoreGateScript() {
  return <script dangerouslySetInnerHTML={{ __html: RESTORE_GATE_SCRIPT }} />;
}
