import { DiscountsManager } from "@/components/admin/scripts/DiscountsManager";
import { LayoutAdmin } from "@/layouts/layout-admin";

export default function AdminApprovals() {
  return (
    <LayoutAdmin>
      <DiscountsManager />
    </LayoutAdmin>
  );
}
