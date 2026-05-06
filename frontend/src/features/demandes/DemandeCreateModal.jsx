// Chemin : frontend/src/features/demandes/DemandeCreateModal.jsx
import Modal            from "../../components/common/Modal";
import NouveauDossierForm from "./NouveauDossierForm";
import { useToast }     from "../../context/ToastContext";

/**
 * Modale de création d'un dossier AMMPS V2.0.
 *
 * Props :
 *   isOpen         — boolean
 *   onClose()      — ferme la modale
 *   onCreated(dem) — callback après succès (refresh liste + toast)
 */
export default function DemandeCreateModal({ isOpen, onClose, onCreated }) {
  const { success } = useToast();

  function handleSuccess(demande) {
    onClose();
    onCreated?.(demande);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouveau dossier AMMPS"
      size="xl"
    >
      <NouveauDossierForm
        onSuccess={handleSuccess}
        onCancel={onClose}
        onToastSuccess={(msg) =>
          success(msg, "Dossier créé")
        }
      />
    </Modal>
  );
}