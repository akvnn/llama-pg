from dataclasses import dataclass


@dataclass
class DocumentSearchResult:
    """
    Data class representing a search result from the vector database.
    """

    id: int
    url: str
    title: str
    text: str
    chunk: str
    distance: float

    def __str__(self):
        return f"""WikiSearchResult:
                ID: {self.id}
                URL: {self.url}
                Title: {self.title}
                Text: {self.text[:100]}...
                Chunk: {self.chunk}
                Distance: {self.distance:.4f}"""
