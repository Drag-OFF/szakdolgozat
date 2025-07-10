import React from "react";

/**
 * Profil oldal komponens.
 * Megjeleníti a bejelentkezett felhasználó adatait.
 *
 * @returns {JSX.Element} A profil oldal tartalma.
 */
export default function Profile() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  if (!user.id) {
    return <div className="auth-msg">Jelentkezz be a profilod megtekintéséhez!</div>;
  }
  return (
    <div className="profile-container">
      <h2>Profil</h2>
      <div><b>Név:</b> {user.name}</div>
      <div><b>Neptun:</b> {user.neptun}</div>
      <div><b>Szak:</b> {user.major}</div>
      {/* További adatok */}
    </div>
  );
}