import Navbar from "@/components/layout/Navbar";
import SellerSignupWizard from "@/components/seller/SellerSignupWizard";

export default function BecomeSellerPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <SellerSignupWizard />
    </main>
  );
}
