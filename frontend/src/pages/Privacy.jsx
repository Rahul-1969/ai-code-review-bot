export default function Privacy() {
  const pageStyle = { maxWidth: "800px", margin: "4rem auto", padding: "2rem", background: "var(--surface)", borderRadius: "24px", boxShadow: "0 12px 30px rgba(53, 169, 232, 0.1)" };
  const h2Style = { color: "var(--primary-dark)", marginTop: "2rem", marginBottom: "1rem", fontSize: "1.25rem" };

  return (
    <div style={pageStyle}>
      <h1 className="section-title">Privacy Policy</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>Last updated: September 26, 2026</p>

      <div style={{ color: "var(--text)", lineHeight: "1.8" }}>
        <h2 style={h2Style}>1. Introduction</h2>
        <p>Welcome to AI Code Review. This Privacy Policy describes how AI Code Review Inc. collects and handles your information when you use our service.</p>

        <h2 style={h2Style}>2. Information We Collect</h2>
        <p>We collect information you directly provide when using the service, including authentication details and code submissions.</p>

        <h2 style={h2Style}>3. How Information Is Used</h2>
        <p>We use the collected information exclusively to provide, maintain, and improve the AI Code Review service.</p>

        <h2 style={h2Style}>4. Code and Repository Data</h2>
        <p>Your code submissions and repository data are processed to generate code reviews. We do not use your code for marketing or public training of models.</p>

        <h2 style={h2Style}>5. Authentication Information</h2>
        <p>We process authentication tokens and necessary account details to verify your identity and secure your access.</p>

        <h2 style={h2Style}>6. Third-Party Services</h2>
        <p>We may transmit your code to third-party language models via secure APIs solely for the purpose of generating the code review analysis.</p>

        <h2 style={h2Style}>7. Data Security</h2>
        <p>We implement appropriate technical measures to protect your code and personal data during transmission and storage.</p>

        <h2 style={h2Style}>8. Data Retention</h2>
        <p>We retain your review history to provide you with historical insights. You may delete your review history through the application interface.</p>

        <h2 style={h2Style}>9. User Rights</h2>
        <p>You have the right to access, correct, or delete your data associated with the AI Code Review service.</p>

        <h2 style={h2Style}>10. Contact Information</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at:<br/>
        Email: contact@aICodeReview.com<br/>
        Address: 123 Tech Lane, San Francisco, CA 94107</p>
      </div>
    </div>
  );
}
