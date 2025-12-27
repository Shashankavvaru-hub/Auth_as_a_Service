export const appVerificationEmail = ({ appName, verifyUrl }) => {
  return `
    <h2>Verify your app</h2>
    <p>Your app <strong>${appName}</strong> was registered successfully.</p>
    <p>Please verify your email by clicking the link below:</p>
    <a href="${verifyUrl}">Verify App Email</a>
    <p>This link expires in 24 hours.</p>
  `;
};
