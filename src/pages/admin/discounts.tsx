import { DiscountsManager } from "@/components/admin/discounts/manager/DiscountsManager";
import { LayoutAdmin } from "@/layouts/layout-admin";

export default function AdminDiscounts() {
  return (
    <LayoutAdmin>
      <DiscountsManager />
    </LayoutAdmin>
  );
}
