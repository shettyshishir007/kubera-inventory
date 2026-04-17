import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useData } from "../lib/dataContext";
import Items from "./Items";

export default function FolderView() {
  const { folderId } = useParams();
  const { folders } = useData();
  const [name, setName] = useState(folderId === "unfiled" ? "Unfiled Items" : "Loading...");

  useEffect(() => {
    if (folderId === "unfiled") {
      setName("Unfiled Items");
      return;
    }
    const folder = folders.find((f) => f.id === folderId);
    if (folder) setName(folder.name);
    else setName("Unknown Folder");
  }, [folderId, folders]);

  return <Items filteredFolderId={folderId} folderName={name} />;
}
