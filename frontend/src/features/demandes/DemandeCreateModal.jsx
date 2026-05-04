// Chemin : frontend/src/features/demandes/DemandeCreateModal.jsx
import Modal              from "../../components/common/Modal";
import DemandeCreateForm  from "./DemandeCreateForm";

/**
 * Modale de création d'une demande.
 *
 * Props :
 *   isOpen          — boolean
 *   onClose()       — ferme la modale
 *   onCreated(dem)  — appelé après succès (déclenche refresh + toast)
 */
export default function DemandeCreateModal({ isOpen, onClose, onCreated }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouveau dossier"
      size="lg"
    >
      <DemandeCreateForm
        onSuccess={onCreated}
        onCancel={onClose}
      />
    </Modal>
  );
}