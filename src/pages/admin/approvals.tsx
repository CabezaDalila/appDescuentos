import { DiscountApprovalManager } from "@/components/admin/DiscountApprovalManager";
import { LayoutAdmin } from "@/layouts/layout-admin";

export default function AdminApprovals() {
  return (
    <LayoutAdmin>
      <DiscountApprovalManager />
    </LayoutAdmin>
  );
}
