import React from "react";
import electron from "electron";

type Post = {
  id: number;
  title: string;
  imageURL: string;
  description: string;
  date: string;
};

function News() {
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);

  electron.ipcRenderer?.on("fetch-news-reply", (event, arg) => {
    setPosts(arg);
    setLoading(false);
  });

  React.useEffect(() => {
    electron.ipcRenderer?.send("fetch-news");
  }, []);
  return (
    <React.Fragment>
      {loading
        ? null
        : posts.map((post) => (
            <div
              key={post.id}
              className="md:w-1/3 pr-4 pl-4 cust_blogteaser"
              style={{ paddingBottom: "20px", marginBottom: "32px" }}
            >
              <a href="#">
                <img
                  className="max-w-full h-auto rounded-md"
                  style={{ height: "auto" }}
                  src={post.imageURL}
                />
              </a>
              <h3
                style={{
                  textAlign: "left",
                  marginTop: "20px",
                  fontFamily: '"Open Sans", sans-serif',
                  fontSize: "18px",
                  marginRight: 0,
                  marginLeft: "24px",
                  lineHeight: "34px",
                  letterSpacing: "0px",
                  fontStyle: "normal",
                  fontWeight: "bold",
                }}
              >
                {post.title}
                <br />
              </h3>
              <p
                className="text-gray-600"
                style={{
                  textAlign: "left",
                  fontSize: "14px",
                  fontFamily: '"Open Sans", sans-serif',
                  lineHeight: "22px",
                  color: "rgb(255,255,255)",
                  marginLeft: "24px",
                }}
              >
                {post.description}
              </p>
              <a className="h4" href="#">
                <i
                  className="fa fa-arrow-circle-right"
                  style={{ marginLeft: "23px" }}
                />
              </a>
            </div>
          ))}
    </React.Fragment>
  );
}

export default News;
