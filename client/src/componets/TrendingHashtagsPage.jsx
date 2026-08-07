import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TrendingHashtagsPage.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function TrendingHashtagsPage() {
  const navigate = useNavigate();

  const [hashtags, setHashtags] = useState([]);
  const [filteredTags, setFilteredTags] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/student/all-hashtags`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setHashtags(data || []);
        setFilteredTags(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const value = search.toLowerCase();

    setFilteredTags(
      hashtags.filter((item) =>
        item.tag.toLowerCase().includes(value)
      )
    );
  }, [search, hashtags]);

  const openHashtag = (tag) => {
  navigate(`/student/trending/${tag.replace("#", "")}`);
};

  return (
    <>

      <div className="hashtagsWrapper">
        <div className="hashtagsContainer">

          <div className="hashtagsHeader">
            <h2>🔥 Explore Hashtags</h2>
            <p>Browse every hashtag used on Gronxity.</p>
          </div>

          <input
            type="text"
            placeholder="Search hashtag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="hashtagSearch"
          />

          {loading ? (
            <div className="loadingText">
              Loading hashtags...
            </div>
          ) : filteredTags.length === 0 ? (
            <div className="loadingText">
              No hashtags found.
            </div>
          ) : (
            filteredTags.map((item) => (
              <div
                key={item.id}
                className="hashtagCard"
                onClick={() => openHashtag(item.tag)}
              >
                <div>
                  <h3>{item.tag}</h3>
                  <span>{item.posts}</span>
                </div>

                <div className="arrow">
                  →
                </div>
              </div>
            ))
          )}

        </div>
      </div>
    </>
  );
}