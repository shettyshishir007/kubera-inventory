import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getFolders } from "../lib/database";
import Items from "./Items";

export default function FolderView() {
  const { folderId } = useParams();
  const [name, setName] = useState(folderId === "unfiled" ? "Unfiled Items" : "Loading...");

  useEffect(() => {
    if (folderId === "unfiled") {
      setName("Unfiled Items");
      return;
    }
    getFolders().then((folders) => {
      const folder = folders.find((f) => f.id === folderId);
      setName(folder?.name || "Unknown Folder");
    });
  }, [folderId]);

  return <Items filteredFolderId={folderId} folderName={name} />;
}
