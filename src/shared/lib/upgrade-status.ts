// Warna label status upgrade creator (UpgradeStatus.status di user.proto:
// pending | approved | rejected | paid). Dipakai dashboard user, creator,
// dan admin supaya status yang sama selalu berwarna sama.
export function upgradeStatusClass(status: string) {
  switch (status) {
    case "approved":
    case "paid":
      return "bg-success/12 text-success";
    case "rejected":
      return "bg-danger/12 text-danger";
    case "pending":
      return "bg-warning/12 text-warning";
    default:
      return "bg-surface-container-high text-copy-secondary";
  }
}
