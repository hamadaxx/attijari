import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { kybApi, profileApi } from '../../api';
import toast from 'react-hot-toast';
import { Shield, CheckCircle, Clock, XCircle, AlertTriangle, FileText, Upload, Lock, Eye } from 'lucide-react';

const KYB_STATUS_INFO = {
  SUBMITTED:     { label: 'Soumis — en attente de revue',          color: '#3b82f6', icon: Clock },
  UNDER_REVIEW:  { label: 'En cours de revue',                     color: '#f59e0b', icon: Clock },
  APPROVED:      { label: 'KYB Approuvé ✓',                        color: '#16a34a', icon: CheckCircle },
  REJECTED:      { label: 'Dossier rejeté',                        color: '#dc2626', icon: XCircle },
  INFO_REQUIRED: { label: 'Informations complémentaires requises',  color: '#f59e0b', icon: AlertTriangle },
};

const LEGAL_FORMS = ['SARL', 'SA', 'SAS', 'SUARL', 'EI', 'SNC', 'Startup (non constituée)'];

const DOC_TYPES = [
  { key: 'ACTE_CONSTITUTION',   label: 'Acte de constitution',     hint: 'Original + copie certifiée conforme — PDF ou image' },
  { key: 'MATRICULE_FISCAL',    label: 'Matricule fiscal INNORPI', hint: 'Carte fiscale originale — PDF ou image' },
  { key: 'CIN_GERANT',          label: 'CIN du gérant',            hint: 'Recto et verso — PDF ou image' },
  { key: 'JUSTIFICATIF_SIEGE',  label: 'Justificatif de siège',    hint: 'Contrat de bail ou titre de propriété — PDF ou image' },
];

export default function KybPage() {
  const [dossier, setDossier]   = useState(null);
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState({});   // { docType: { fileId, fileName } }
  const [uploading, setUploading]         = useState({});   // { docType: true/false }
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm();

  useEffect(() => {
    Promise.all([
      kybApi.getMyDossier().catch(e => e.response?.status === 404 ? null : Promise.reject(e)),
      profileApi.getMe().catch(() => null),
    ]).then(([dossierRes, profileRes]) => {
      setDossier(dossierRes?.data ?? null);
      setProfile(profileRes?.data ?? null);
    }).catch(() => toast.error('Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = async (docType, file) => {
    if (!file) return;
    setUploading(prev => ({ ...prev, [docType]: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('docType', docType);
      const res = await kybApi.uploadDocument(fd);
      setUploadedFiles(prev => ({ ...prev, [docType]: { fileId: res.data.fileId, fileName: res.data.fileName } }));
      toast.success('Fichier téléversé.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur lors du téléversement.');
    } finally {
      setUploading(prev => ({ ...prev, [docType]: false }));
    }
  };

  const handleViewDocument = async (fileId, fileName) => {
    try {
      const res = await kybApi.getDocument(fileId);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      toast.error('Impossible d\'ouvrir le document.');
    }
  };

  const allUploaded = DOC_TYPES.every(d => uploadedFiles[d.key]);

  async function onSubmit(data) {
    if (!allUploaded) {
      toast.error('Veuillez téléverser les 4 pièces justificatives avant de soumettre.');
      return;
    }
    try {
      const documentFileIds   = Object.fromEntries(DOC_TYPES.map(d => [d.key, uploadedFiles[d.key].fileId]));
      const documentFileNames = Object.fromEntries(DOC_TYPES.map(d => [d.key, uploadedFiles[d.key].fileName]));
      const res = await kybApi.submit({ ...data, documentFileIds, documentFileNames });
      setDossier(res.data);
      toast.success('Dossier KYB soumis. Le Compliance Officer vous contactera dans les 48h ouvrées.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur lors de la soumission.');
    }
  }

  if (loading) return <div style={{ padding: '32px 40px', color: '#9ca3af' }}>Chargement…</div>;

  // Profile not yet approved — block form with clear explanation
  if (!dossier && profile?.status !== 'APPROVED') {
    return (
      <div style={{ padding: '32px 40px', maxWidth: 600 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={20} /> Dossier KYB — Identité légale
        </h1>
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Lock size={18} color="#f59e0b" />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#92400e' }}>Accès conditionnel</span>
          </div>
          <p style={{ fontSize: 13, color: '#78350f', margin: 0, lineHeight: 1.6 }}>
            Le dossier KYB ne peut être soumis qu'une fois votre <strong>profil communautaire validé</strong> par l'Admin.
            {profile
              ? ` Statut actuel : ${profile.status === 'PENDING_VALIDATION' ? 'En attente de validation' : profile.status === 'AWAITING_INFO' ? 'Informations complémentaires demandées' : profile.status}.`
              : ' Vous n\'avez pas encore de profil — créez-le depuis "Mon profil".'}
          </p>
        </div>
      </div>
    );
  }

  const statusInfo = dossier ? KYB_STATUS_INFO[dossier.status] : null;
  const StatusIcon = statusInfo?.icon || Clock;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 740 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={20} /> Dossier KYB — Identité légale
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          Requis pour accéder au Venture Studio et au module Smart Financing (Circulaire BCT 2017-01)
        </p>
      </div>

      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 12, color: '#0369a1' }}>
        <strong>Référentiel réglementaire :</strong> Loi n°2016-48 (BCT) · Circulaire BCT 2017-01 (KYC/AML) · Startup Act 2018 (Loi n°2018-20) · RGPD
      </div>

      {dossier ? (
        /* ── Dossier already submitted ──────────────────────────── */
        <div>
          <div style={{ background: 'white', borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <StatusIcon size={20} color={statusInfo?.color} />
              <span style={{ fontSize: 16, fontWeight: 700, color: statusInfo?.color }}>{statusInfo?.label}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, color: '#374151', marginBottom: 16 }}>
              <InfoRow label="Raison sociale" value={dossier.companyName} />
              <InfoRow label="Forme juridique" value={dossier.legalForm} />
              <InfoRow label="Matricule fiscal" value={dossier.fiscalMatricule} />
              {dossier.startupActNumber && <InfoRow label="N° ANPE (Startup Act)" value={dossier.startupActNumber} />}
              <InfoRow label="Représentant légal" value={dossier.representativeFullName} />
              <InfoRow label="CIN Gérant" value={dossier.representativeCin} />
            </div>

            {/* Uploaded documents */}
            {dossier.documentFileIds && Object.keys(dossier.documentFileIds).length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>Pièces téléversées</div>
                {DOC_TYPES.map(({ key, label }) => {
                  const fileId   = dossier.documentFileIds?.[key];
                  const fileName = dossier.documentFileNames?.[key];
                  return fileId ? (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle size={13} color="#16a34a" />
                        <span>{label}</span>
                      </div>
                      <button onClick={() => handleViewDocument(fileId, fileName)}
                        style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 5, padding: '2px 8px', fontSize: 11, cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Eye size={11} /> Voir
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            )}

            {dossier.rejectionReason && (
              <div style={{ marginTop: 12, background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#b91c1c' }}>
                <strong>Motif de rejet :</strong> {dossier.rejectionReason}
              </div>
            )}
            {dossier.infoRequested && (
              <div style={{ marginTop: 12, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e' }}>
                <strong>Informations demandées :</strong> {dossier.infoRequested}
              </div>
            )}

            <div style={{ marginTop: 12, fontSize: 11, color: '#9ca3af' }}>
              Soumis le {dossier.submittedAt ? new Date(dossier.submittedAt).toLocaleDateString('fr-FR') : '—'}
              {dossier.reviewedAt && ` · Révisé le ${new Date(dossier.reviewedAt).toLocaleDateString('fr-FR')}`}
            </div>
          </div>

          {dossier.auditLog?.length > 0 && (
            <div style={{ background: 'white', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 10 }}>Journal d'audit</div>
              {dossier.auditLog.map((entry, i) => (
                <div key={i} style={{ fontSize: 12, color: '#6b7280', padding: '6px 0', borderBottom: i < dossier.auditLog.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <strong>{entry.action}</strong> — {entry.timestamp ? new Date(entry.timestamp).toLocaleString('fr-FR') : ''}
                  {entry.note && ` : ${entry.note}`}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── Submission form ────────────────────────────────────── */
        <div style={{ background: 'white', borderRadius: 10, padding: '28px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 20 }}>Soumettre votre dossier KYB</h2>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <SectionTitle>Identité juridique de la startup</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Raison sociale *" error={errors.companyName?.message}>
                <input {...register('companyName', { required: 'Requis' })} placeholder="Ex. : Innova Tech SARL" style={inputStyle} />
              </Field>
              <Field label="Forme juridique *" error={errors.legalForm?.message}>
                <select {...register('legalForm', { required: 'Requis' })} style={inputStyle}>
                  <option value="">— Sélectionner —</option>
                  {LEGAL_FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Matricule fiscal INNORPI *" error={errors.fiscalMatricule?.message}>
                <input {...register('fiscalMatricule', { required: 'Requis' })} placeholder="Ex. : 1234567A/P/M/000" style={inputStyle} />
              </Field>
              <Field label="Numéro ANPE (Startup Act — optionnel)">
                <input {...register('startupActNumber')} placeholder="Si startup certifiée ANPE" style={inputStyle} />
              </Field>
              <Field label="Adresse du siège social *" error={errors.registeredAddress?.message}>
                <input {...register('registeredAddress', { required: 'Requis' })} placeholder="Adresse complète" style={inputStyle} />
              </Field>
            </div>

            <SectionTitle>Représentant légal</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Nom complet du gérant *" error={errors.representativeFullName?.message}>
                <input {...register('representativeFullName', { required: 'Requis' })} style={inputStyle} />
              </Field>
              <Field label="Numéro CIN du gérant *" error={errors.representativeCin?.message}>
                <input {...register('representativeCin', { required: 'Requis' })} placeholder="Ex. : 12345678" style={inputStyle} />
              </Field>
            </div>

            <SectionTitle>Pièces justificatives</SectionTitle>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '-8px 0 4px' }}>
              Téléversez chaque document (PDF, JPG ou PNG — 10 Mo max par fichier). Les fichiers sont chiffrés et stockés de manière sécurisée.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DOC_TYPES.map(({ key, label, hint }) => (
                <DocUploadRow
                  key={key}
                  label={label}
                  hint={hint}
                  uploaded={uploadedFiles[key]}
                  isUploading={!!uploading[key]}
                  onFileChange={(file) => handleFileChange(key, file)}
                  onView={() => handleViewDocument(uploadedFiles[key].fileId, uploadedFiles[key].fileName)}
                />
              ))}
            </div>

            {/* Upload progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 4, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4, background: allUploaded ? '#16a34a' : '#F8B618',
                  width: `${(DOC_TYPES.filter(d => uploadedFiles[d.key]).length / DOC_TYPES.length) * 100}%`,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <span style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                {DOC_TYPES.filter(d => uploadedFiles[d.key]).length} / {DOC_TYPES.length} téléversé(s)
              </span>
            </div>

            <div style={{ padding: '12px 14px', background: '#f9fafb', borderRadius: 8, fontSize: 12, color: '#6b7280' }}>
              En soumettant ce dossier, vous confirmez l'exactitude des informations fournies et autorisez Attijari Bank à les vérifier dans le cadre de la Circulaire BCT 2017-01.
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !allUploaded}
              style={{
                padding: '12px', background: allUploaded ? '#E8543F' : '#d1d5db', color: 'white',
                border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700,
                cursor: allUploaded ? 'pointer' : 'not-allowed',
              }}
            >
              {isSubmitting ? 'Envoi en cours…' : allUploaded ? 'Soumettre le dossier KYB' : 'Téléversez toutes les pièces pour continuer'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function DocUploadRow({ label, hint, uploaded, isUploading, onFileChange, onView }) {
  const inputRef = useRef();

  return (
    <div style={{
      border: `1px solid ${uploaded ? '#bbf7d0' : '#e5e7eb'}`,
      borderRadius: 8, padding: '14px 16px',
      background: uploaded ? '#f0fdf4' : 'white',
      transition: 'border-color 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label} *</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{hint}</div>
          {uploaded && (
            <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {uploaded.fileName}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {uploaded && (
            <button type="button" onClick={onView}
              style={{ padding: '6px 10px', fontSize: 12, background: 'white', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Eye size={12} /> Voir
            </button>
          )}
          <button type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            style={{
              padding: '6px 12px', fontSize: 12, fontWeight: 600,
              background: uploaded ? '#f9fafb' : '#E8543F', color: uploaded ? '#374151' : 'white',
              border: `1px solid ${uploaded ? '#d1d5db' : '#E8543F'}`, borderRadius: 6,
              cursor: isUploading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            {isUploading ? (
              'Téléversement…'
            ) : uploaded ? (
              <><Upload size={12} /> Remplacer</>
            ) : (
              <><Upload size={12} /> Choisir un fichier</>
            )}
          </button>
          <input
            ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) onFileChange(f); e.target.value = ''; }}
          />
        </div>
      </div>

      {!uploaded && !isUploading && (
        <div
          style={{ marginTop: 10, border: '2px dashed #e5e7eb', borderRadius: 6, padding: '14px', textAlign: 'center', cursor: 'pointer', color: '#9ca3af', fontSize: 12 }}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#F8B618'; }}
          onDragLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
          onDrop={e => {
            e.preventDefault();
            e.currentTarget.style.borderColor = '#e5e7eb';
            const f = e.dataTransfer.files?.[0];
            if (f) onFileChange(f);
          }}
        >
          Glissez-déposez votre fichier ici ou cliquez pour parcourir
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: 6,
  border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box',
};

function Field({ label, error, children }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{label}</label>
      {children}
      {error && <p style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{error}</p>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f3f4f6', paddingBottom: 6, marginTop: 4 }}>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 13 }}>{value}</div>
    </div>
  );
}
