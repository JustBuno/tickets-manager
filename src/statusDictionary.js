const STATUS_TEXT_PT = {
    0: "Não Reparado",
    1: "Em Progresso",
    2: "Pendente - Cliente",
    3: "Pendente - Material",
    4: "Concluído"
};

const STATUS_TEXT_EN = {
    0: "Not Repaired",
    1: "In Progress",
    2: "Pending - Client",
    3: "Pending - Parts",
    4: "Finished"
};

// Check the language setting in sessionStorage
const language = sessionStorage.getItem("language");
const STATUS_TEXT = language === "pt" ? STATUS_TEXT_PT: STATUS_TEXT_EN;

export default STATUS_TEXT;