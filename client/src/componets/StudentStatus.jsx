import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./StudentStatus.css";

import {
  Heart,
  RotateCcw,
  Maximize,
} from "lucide-react";

import Cropper from "react-easy-crop";

const API_BASE = import.meta.env.VITE_API_URL;

const IMAGE_TIME = 5000;

export default function StudentStatus({
  setShowNavbar,
}) {
  const loggedInUser = JSON.parse(
    localStorage.getItem("user")
  );

  /* =========================================================
     FORM
  ========================================================= */

  const [form, setForm] = useState({
    caption: "",
    mediaFile: null,
    mediaPreview: "",
    mediaType: "",
  });

  /* =========================================================
     STATUS DATA
  ========================================================= */

  const [statuses, setStatuses] = useState([]);
  const [myStatuses, setMyStatuses] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [fetching, setFetching] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  /* =========================================================
     VIEWER
  ========================================================= */

  const [viewerOpen, setViewerOpen] =
    useState(false);

  const [activeGroupIndex, setActiveGroupIndex] =
    useState(0);

  const [activeStoryIndex, setActiveStoryIndex] =
    useState(0);

  /* =========================================================
     CREATE
  ========================================================= */

  const [createOpen, setCreateOpen] =
    useState(false);

  const [showViewSheet, setShowViewSheet] =
    useState(false);

  /* =========================================================
     REPLY
  ========================================================= */

  const [replyText, setReplyText] =
    useState("");

  const [sendingReply, setSendingReply] =
    useState(false);

  const [isReplyFocused, setIsReplyFocused] =
    useState(false);

  /* =========================================================
     CROP
  ========================================================= */

  const [cropOpen, setCropOpen] =
    useState(false);

  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] =
    useState(1);

  const [rotation, setRotation] =
    useState(0);

  const [cropAspect, setCropAspect] =
    useState(9 / 16);

  const [cropShapeName, setCropShapeName] =
    useState("9:16");

  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState(null);

  const [cropProcessing, setCropProcessing] =
    useState(false);

  /* =========================================================
     REFS
  ========================================================= */

  const timerRef = useRef(null);

  const videoRef = useRef(null);

  const stripRef = useRef(null);

  const newStoryScrollRef =
    useRef(false);

  /* =========================================================
     SCROLL
  ========================================================= */

  const [canScrollLeft, setCanScrollLeft] =
    useState(false);

  const [canScrollRight, setCanScrollRight] =
    useState(false);

  /* =========================================================
     FETCH
  ========================================================= */

  useEffect(() => {
    fetchStatuses();
    fetchMyStatuses();
  }, []);

  /* =========================================================
     GROUP STATUSES
  ========================================================= */

  const groupedStatuses = useMemo(() => {
    const grouped =
      statuses.reduce(
        (acc, item) => {
          const key =
            item.userId ||
            item.studentId ||
            item.authorId ||
            item.email ||
            item.author ||
            item._id;

          if (!acc[key]) {
            acc[key] = {
              userKey: key,
              author:
                item.author ||
                "Student",
              profileImage:
                item.profileImage ||
                "",
              stories: [],
            };
          }

          acc[key].stories.push(item);

          return acc;
        },
        {}
      );

    return Object.values(grouped);
  }, [statuses]);

  /* =========================================================
     ACTIVE GROUP
  ========================================================= */

  const activeGroup = useMemo(() => {
    return (
      groupedStatuses[
        activeGroupIndex
      ] || null
    );
  }, [
    groupedStatuses,
    activeGroupIndex,
  ]);

  /* =========================================================
     CURRENT STATUS
  ========================================================= */

  const currentStatus = useMemo(() => {
    if (!activeGroup) return null;

    return (
      activeGroup.stories[
        activeStoryIndex
      ] || null
    );
  }, [
    activeGroup,
    activeStoryIndex,
  ]);

  /* =========================================================
     OWN STATUS
  ========================================================= */

  const isOwnStatus =
    currentStatus &&
    String(currentStatus.userId) ===
      String(loggedInUser?._id);

  /* =========================================================
     VIEWERS
  ========================================================= */

  const filteredViewers = (
    currentStatus?.viewers || []
  ).filter(
    (viewer) =>
      String(viewer.userId) !==
      String(loggedInUser?._id)
  );

  /* =========================================================
     PAUSE
  ========================================================= */

  const isPaused =
    showViewSheet ||
    sendingReply ||
    isReplyFocused ||
    replyText.trim().length > 0;

  /* =========================================================
     SCROLL BUTTONS
  ========================================================= */

  useEffect(() => {
    updateScrollButtons();

    const el = stripRef.current;

    if (!el) return;

    el.addEventListener(
      "scroll",
      updateScrollButtons
    );

    window.addEventListener(
      "resize",
      updateScrollButtons
    );

    return () => {
      el.removeEventListener(
        "scroll",
        updateScrollButtons
      );

      window.removeEventListener(
        "resize",
        updateScrollButtons
      );
    };
  }, [groupedStatuses]);

  const updateScrollButtons = () => {
    const el = stripRef.current;

    if (!el) return;

    const maxScrollLeft =
      el.scrollWidth -
      el.clientWidth;

    setCanScrollLeft(
      el.scrollLeft > 5
    );

    setCanScrollRight(
      el.scrollLeft <
        maxScrollLeft - 5
    );
  };

  const scrollStories = (
    direction
  ) => {
    const el = stripRef.current;

    if (!el) return;

    el.scrollBy({
      left:
        direction === "left"
          ? -320
          : 320,
      behavior: "smooth",
    });
  };

  /* =========================================================
     VIEWER TIMER
  ========================================================= */

  const clearViewerTimer = () => {
    if (timerRef.current) {
      clearTimeout(
        timerRef.current
      );

      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (
      !viewerOpen ||
      !currentStatus
    ) {
      return;
    }

    clearViewerTimer();

    if (
      currentStatus.mediaType ===
        "image" &&
      !isPaused
    ) {
      timerRef.current =
        setTimeout(() => {
          handleNext();
        }, IMAGE_TIME);
    }

    return () => {
      clearViewerTimer();
    };
  }, [
    viewerOpen,
    currentStatus,
    activeStoryIndex,
    activeGroupIndex,
    isPaused,
  ]);

  /* =========================================================
     VIDEO PLAY / PAUSE
  ========================================================= */

  useEffect(() => {
    if (!viewerOpen) return;

    if (!videoRef.current) return;

    if (
      currentStatus?.mediaType !==
      "video"
    ) {
      return;
    }

    if (isPaused) {
      videoRef.current.pause();
    } else {
      videoRef.current
        .play()
        .catch(() => {});
    }
  }, [
    viewerOpen,
    currentStatus,
    isPaused,
  ]);

  /* =========================================================
     TRACK VIEW
  ========================================================= */

  useEffect(() => {
    if (
      !viewerOpen ||
      !currentStatus?._id
    ) {
      return;
    }

    const trackView = async () => {
      try {
        await fetch(
          `${API_BASE}/api/student/status/${currentStatus._id}/view`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        await fetchStatuses();
        await fetchMyStatuses();
      } catch (err) {
        console.error(
          "Track status view error:",
          err
        );
      }
    };

    trackView();
  }, [
    viewerOpen,
    currentStatus?._id,
  ]);

  /* =========================================================
     RESET FORM
  ========================================================= */

  const resetForm = () => {
    if (form.mediaPreview) {
      URL.revokeObjectURL(
        form.mediaPreview
      );
    }

    setForm({
      caption: "",
      mediaFile: null,
      mediaPreview: "",
      mediaType: "",
    });

    setError("");
    setMessage("");
  };

  /* =========================================================
     OPEN CREATE
  ========================================================= */

  const openCreateModal = () => {
    setShowNavbar(false);

    setCreateOpen(true);

    setError("");
    setMessage("");
  };

  /* =========================================================
     CLOSE CREATE
  ========================================================= */

  const closeCreateModal = () => {
    setShowNavbar(true);

    setCreateOpen(false);

    setCropOpen(false);

    resetForm();
  };

  /* =========================================================
     CAPTION
  ========================================================= */

  const handleCaptionChange = (
    value
  ) => {
    setForm((prev) => ({
      ...prev,
      caption: value,
    }));

    setError("");
    setMessage("");
  };

  /* =========================================================
     CROP RATIOS
  ========================================================= */

  const cropRatios = [
    {
      name: "Original",
      value: null,
    },
    {
      name: "1:1",
      value: 1,
    },
    {
      name: "4:5",
      value: 4 / 5,
    },
    {
      name: "9:16",
      value: 9 / 16,
    },
    {
      name: "16:9",
      value: 16 / 9,
    },
  ];

  /* =========================================================
     CROP COMPLETE
  ========================================================= */

  const onCropComplete = (
    _,
    croppedPixels
  ) => {
    setCroppedAreaPixels(
      croppedPixels
    );
  };

  /* =========================================================
     CHANGE ASPECT
  ========================================================= */

  const handleAspectChange = (
    ratio
  ) => {
    setCropShapeName(
      ratio.name
    );

    if (
      ratio.value === null
    ) {
      if (!form.mediaFile) {
        return;
      }

      if (
        form.mediaType ===
        "image"
      ) {
        const img =
          new Image();

        img.onload = () => {
          if (
            img.width &&
            img.height
          ) {
            setCropAspect(
              img.width /
                img.height
            );
          }
        };

        img.src =
          form.mediaPreview;
      } else {
        const video =
          document.createElement(
            "video"
          );

        video.preload =
          "metadata";

        video.onloadedmetadata =
          () => {
            if (
              video.videoWidth &&
              video.videoHeight
            ) {
              setCropAspect(
                video.videoWidth /
                  video.videoHeight
              );
            }
          };

        video.src =
          form.mediaPreview;
      }

      return;
    }

    setCropAspect(
      ratio.value
    );
  };

  /* =========================================================
     OPEN CROP
  ========================================================= */

  const openCropEditor = () => {
    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);

    setRotation(0);

    setCropShapeName(
      "9:16"
    );

    setCropAspect(
      9 / 16
    );

    setCroppedAreaPixels(
      null
    );

    setCropOpen(true);
  };

  /* =========================================================
     CLOSE CROP
  ========================================================= */

  const closeCropEditor = () => {
    if (cropProcessing) {
      return;
    }

    setCropOpen(false);
  };

  /* =========================================================
     MEDIA CHANGE
  ========================================================= */

  const handleMediaChange = (
    e
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) return;

    const isImage =
      file.type.startsWith(
        "image/"
      );

    const isVideo =
      file.type.startsWith(
        "video/"
      );

    if (
      !isImage &&
      !isVideo
    ) {
      setError(
        "Only image or video file is allowed"
      );

      return;
    }

    if (form.mediaPreview) {
      URL.revokeObjectURL(
        form.mediaPreview
      );
    }

    const previewUrl =
      URL.createObjectURL(
        file
      );

    setForm((prev) => ({
      ...prev,
      mediaFile: file,
      mediaPreview:
        previewUrl,
      mediaType: isImage
        ? "image"
        : "video",
    }));

    setError("");
    setMessage("");

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);

    setRotation(0);

    setCropShapeName(
      "9:16"
    );

    setCropAspect(
      9 / 16
    );

    setCroppedAreaPixels(
      null
    );

    setTimeout(() => {
      setCropOpen(true);
    }, 50);
  };

  /* =========================================================
     IMAGE CROP
  ========================================================= */

  const createCroppedImage =
    async (
      imageSrc,
      pixelCrop,
      rotationValue = 0
    ) => {
      const image =
        await new Promise(
          (
            resolve,
            reject
          ) => {
            const img =
              new Image();

            img.onload = () =>
              resolve(img);

            img.onerror =
              reject;

            img.src =
              imageSrc;
          }
        );

      if (!pixelCrop) {
        throw new Error(
          "Crop area is not ready"
        );
      }

      const canvas =
        document.createElement(
          "canvas"
        );

      const ctx =
        canvas.getContext(
          "2d"
        );

      if (!ctx) {
        throw new Error(
          "Canvas is not supported"
        );
      }

      const radians =
        (rotationValue *
          Math.PI) /
        180;

      const sin =
        Math.abs(
          Math.sin(
            radians
          )
        );

      const cos =
        Math.abs(
          Math.cos(
            radians
          )
        );

      const rotatedWidth =
        image.width * cos +
        image.height * sin;

      const rotatedHeight =
        image.width * sin +
        image.height * cos;

      canvas.width =
        Math.round(
          pixelCrop.width
        );

      canvas.height =
        Math.round(
          pixelCrop.height
        );

      ctx.save();

      ctx.translate(
        rotatedWidth / 2 -
          pixelCrop.x,
        rotatedHeight / 2 -
          pixelCrop.y
      );

      ctx.rotate(
        radians
      );

      ctx.translate(
        -image.width / 2,
        -image.height / 2
      );

      ctx.drawImage(
        image,
        0,
        0
      );

      ctx.restore();

      const blob =
        await new Promise(
          (resolve) => {
            canvas.toBlob(
              resolve,
              "image/jpeg",
              0.92
            );
          }
        );

      if (!blob) {
        throw new Error(
          "Failed to create cropped image"
        );
      }

      return new File(
        [blob],
        `cropped-${Date.now()}.jpg`,
        {
          type: "image/jpeg",
        }
      );
    };

  /* =========================================================
     VIDEO CROP
  ========================================================= */

  const createCroppedVideo =
    async () => {
      return new Promise(
        async (
          resolve,
          reject
        ) => {
          try {
            const video =
              document.createElement(
                "video"
              );

            video.src =
              form.mediaPreview;

            video.muted = true;

            video.playsInline =
              true;

            video.preload =
              "auto";

            await new Promise(
              (
                res,
                rej
              ) => {
                video.onloadedmetadata =
                  res;

                video.onerror =
                  rej;
              }
            );

            const videoWidth =
              video.videoWidth;

            const videoHeight =
              video.videoHeight;

            if (
              !videoWidth ||
              !videoHeight
            ) {
              throw new Error(
                "Could not read video dimensions"
              );
            }

            /*
              Output size
            */

            let outputWidth =
              720;

            let outputHeight =
              Math.round(
                outputWidth /
                  cropAspect
              );

            if (
              outputHeight >
              1280
            ) {
              outputHeight =
                1280;

              outputWidth =
                Math.round(
                  outputHeight *
                    cropAspect
                );
            }

            outputWidth =
              outputWidth % 2 === 0
                ? outputWidth
                : outputWidth - 1;

            outputHeight =
              outputHeight % 2 === 0
                ? outputHeight
                : outputHeight - 1;

            const canvas =
              document.createElement(
                "canvas"
              );

            canvas.width =
              outputWidth;

            canvas.height =
              outputHeight;

            const ctx =
              canvas.getContext(
                "2d"
              );

            if (!ctx) {
              throw new Error(
                "Canvas is not supported"
              );
            }

            /*
              Calculate source crop
            */

            const sourceAspect =
              videoWidth /
              videoHeight;

            let sourceWidth;

            let sourceHeight;

            if (
              sourceAspect >
              cropAspect
            ) {
              sourceHeight =
                videoHeight;

              sourceWidth =
                videoHeight *
                cropAspect;
            } else {
              sourceWidth =
                videoWidth;

              sourceHeight =
                videoWidth /
                cropAspect;
            }

            /*
              Get crop position
            */

            let sourceX =
              (videoWidth -
                sourceWidth) /
              2;

            let sourceY =
              (videoHeight -
                sourceHeight) /
              2;

            if (
              croppedAreaPixels
            ) {
              const cropCenterX =
                croppedAreaPixels.x +
                croppedAreaPixels.width /
                  2;

              const cropCenterY =
                croppedAreaPixels.y +
                croppedAreaPixels.height /
                  2;

              const centerX =
                videoWidth / 2;

              const centerY =
                videoHeight / 2;

              const moveX =
                (cropCenterX -
                  centerX) *
                (videoWidth /
                  Math.max(
                    1,
                    croppedAreaPixels.width
                  ));

              const moveY =
                (cropCenterY -
                  centerY) *
                (videoHeight /
                  Math.max(
                    1,
                    croppedAreaPixels.height
                  ));

              sourceX +=
                moveX;

              sourceY +=
                moveY;
            }

            sourceX =
              Math.max(
                0,
                Math.min(
                  sourceX,
                  videoWidth -
                    sourceWidth
                )
              );

            sourceY =
              Math.max(
                0,
                Math.min(
                  sourceY,
                  videoHeight -
                    sourceHeight
                )
              );

            /*
              Canvas stream
            */

            const canvasStream =
              canvas.captureStream(
                30
              );

            /*
              Add audio
            */

            try {
              const audioContext =
                new AudioContext();

              const source =
                audioContext.createMediaElementSource(
                  video
                );

              const destination =
                audioContext.createMediaStreamDestination();

              source.connect(
                destination
              );

              destination.stream
                .getAudioTracks()
                .forEach(
                  (track) => {
                    canvasStream.addTrack(
                      track
                    );
                  }
                );
            } catch (
              audioError
            ) {
              console.warn(
                "Video audio could not be attached:",
                audioError
              );
            }

            /*
              Recorder format
            */

            let mimeType =
              "video/webm;codecs=vp9";

            if (
              !MediaRecorder.isTypeSupported(
                mimeType
              )
            ) {
              mimeType =
                "video/webm;codecs=vp8";
            }

            if (
              !MediaRecorder.isTypeSupported(
                mimeType
              )
            ) {
              mimeType =
                "video/webm";
            }

            const recorder =
              new MediaRecorder(
                canvasStream,
                {
                  mimeType,
                  videoBitsPerSecond:
                    5_000_000,
                }
              );

            const chunks =
              [];

            recorder.ondataavailable =
              (event) => {
                if (
                  event.data &&
                  event.data.size >
                    0
                ) {
                  chunks.push(
                    event.data
                  );
                }
              };

            recorder.onerror =
              (event) => {
                reject(
                  event.error ||
                    new Error(
                      "Video recording failed"
                    )
                );
              };

            recorder.onstop =
              () => {
                const blob =
                  new Blob(
                    chunks,
                    {
                      type: mimeType,
                    }
                  );

                const file =
                  new File(
                    [blob],
                    `cropped-${Date.now()}.webm`,
                    {
                      type: mimeType,
                    }
                  );

                resolve(file);
              };

            /*
              Start recording
            */

            recorder.start(200);

            video.currentTime = 0;

            await video.play();

            /*
              Draw video
            */

            let animationFrame;

            const drawFrame =
              () => {
                if (
                  video.paused ||
                  video.ended
                ) {
                  return;
                }

                ctx.clearRect(
                  0,
                  0,
                  outputWidth,
                  outputHeight
                );

                ctx.drawImage(
                  video,
                  sourceX,
                  sourceY,
                  sourceWidth,
                  sourceHeight,
                  0,
                  0,
                  outputWidth,
                  outputHeight
                );

                animationFrame =
                  requestAnimationFrame(
                    drawFrame
                  );
              };

            drawFrame();

            /*
              Stop when video ends
            */

            video.onended =
              () => {
                if (
                  animationFrame
                ) {
                  cancelAnimationFrame(
                    animationFrame
                  );
                }

                if (
                  recorder.state !==
                  "inactive"
                ) {
                  recorder.stop();
                }
              };
          } catch (err) {
            reject(err);
          }
        }
      );
    };

  /* =========================================================
     APPLY CROP
  ========================================================= */

  const applyCrop =
    async () => {
      if (
        !form.mediaFile
      ) {
        return;
      }

      try {
        setCropProcessing(
          true
        );

        setError("");

        let croppedFile;

        if (
          form.mediaType ===
          "image"
        ) {
          croppedFile =
            await createCroppedImage(
              form.mediaPreview,
              croppedAreaPixels,
              rotation
            );
        } else {
          croppedFile =
            await createCroppedVideo();
        }

        const newPreview =
          URL.createObjectURL(
            croppedFile
          );

        if (
          form.mediaPreview
        ) {
          URL.revokeObjectURL(
            form.mediaPreview
          );
        }

        setForm((prev) => ({
          ...prev,
          mediaFile:
            croppedFile,
          mediaPreview:
            newPreview,
        }));

        setCropOpen(false);
      } catch (err) {
        console.error(
          "Crop error:",
          err
        );

        setError(
          err.message ||
            "Failed to crop media"
        );
      } finally {
        setCropProcessing(
          false
        );
      }
    };

  /* =========================================================
     FETCH STATUSES
  ========================================================= */

  const fetchStatuses =
    async () => {
      try {
        setFetching(true);

        setError("");

        const res =
          await fetch(
            `${API_BASE}/api/student/status`,
            {
              method: "GET",
              credentials:
                "include",
            }
          );

        const text =
          await res.text();

        let data;

        try {
          data =
            JSON.parse(text);
        } catch {
          throw new Error(
            "Server did not return JSON. Check backend route/API."
          );
        }

        if (!res.ok) {
          throw new Error(
            data.message ||
              "Failed to fetch statuses"
          );
        }

        setStatuses(
          Array.isArray(
            data
          )
            ? data
            : []
        );
      } catch (err) {
        console.error(
          "Fetch status error:",
          err
        );

        setError(
          err.message ||
            "Something went wrong while fetching statuses"
        );
      } finally {
        setFetching(
          false
        );
      }
    };

  /* =========================================================
     FETCH MY STATUS
  ========================================================= */

  const fetchMyStatuses =
    async () => {
      try {
        const res =
          await fetch(
            `${API_BASE}/api/student/my-status`,
            {
              method: "GET",
              credentials:
                "include",
            }
          );

        const text =
          await res.text();

        let data = [];

        try {
          data =
            JSON.parse(text);
        } catch {
          data = [];
        }

        if (res.ok) {
          setMyStatuses(
            Array.isArray(
              data
            )
              ? data
              : []
          );
        }
      } catch (err) {
        console.error(
          "Fetch my statuses error:",
          err
        );
      }
    };

  /* =========================================================
     CREATE STATUS
  ========================================================= */

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      setMessage("");
      setError("");

      if (
        !form.mediaFile
      ) {
        setError(
          "Please upload image or video"
        );

        return;
      }

      try {
        setLoading(true);

        const formData =
          new FormData();

        formData.append(
          "caption",
          form.caption.trim()
        );

        formData.append(
          "statusMedia",
          form.mediaFile
        );

        const res =
          await fetch(
            `${API_BASE}/api/student/status`,
            {
              method: "POST",
              credentials:
                "include",
              body: formData,
            }
          );

        const text =
          await res.text();

        let data;

        try {
          data =
            JSON.parse(text);
        } catch {
          throw new Error(
            "Server did not return JSON. Check backend POST route."
          );
        }

        if (!res.ok) {
          throw new Error(
            data.message ||
              "Failed to create status"
          );
        }

        setMessage(
          "Status posted successfully"
        );

        await fetchStatuses();

        await fetchMyStatuses();

        newStoryScrollRef.current =
          true;

        setTimeout(() => {
          closeCreateModal();
        }, 700);
      } catch (err) {
        console.error(
          "Create status error:",
          err
        );

        setError(
          err.message ||
            "Something went wrong while posting status"
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     OPEN VIEWER
  ========================================================= */

  const openViewer =
    (groupIndex) => {
      setActiveGroupIndex(
        groupIndex
      );

      setActiveStoryIndex(
        0
      );

      setViewerOpen(
        true
      );

      setReplyText("");

      setShowViewSheet(
        false
      );

      setIsReplyFocused(
        false
      );
    };

  /* =========================================================
     CLOSE VIEWER
  ========================================================= */

  const closeViewer = () => {
    clearViewerTimer();

    setViewerOpen(false);

    setActiveStoryIndex(
      0
    );

    setReplyText("");

    setShowViewSheet(
      false
    );

    setIsReplyFocused(
      false
    );
  };

  /* =========================================================
     PREVIOUS
  ========================================================= */

  const handlePrev = () => {
    if (!activeGroup) {
      return;
    }

    if (
      activeStoryIndex >
      0
    ) {
      setActiveStoryIndex(
        (prev) =>
          prev - 1
      );

      return;
    }

    if (
      activeGroupIndex >
      0
    ) {
      const prevGroupIndex =
        activeGroupIndex -
        1;

      const prevGroup =
        groupedStatuses[
          prevGroupIndex
        ];

      setActiveGroupIndex(
        prevGroupIndex
      );

      setActiveStoryIndex(
        (prevGroup
          ?.stories
          ?.length ||
          1) - 1
      );
    }
  };

  /* =========================================================
     NEXT
  ========================================================= */

  const handleNext = () => {
    if (!activeGroup) {
      return;
    }

    if (
      activeStoryIndex <
      activeGroup.stories
        .length -
        1
    ) {
      setActiveStoryIndex(
        (prev) =>
          prev + 1
      );

      return;
    }

    if (
      activeGroupIndex <
      groupedStatuses.length -
        1
    ) {
      setActiveGroupIndex(
        (prev) =>
          prev + 1
      );

      setActiveStoryIndex(
        0
      );

      return;
    }

    closeViewer();
  };

  /* =========================================================
     REMAINING TIME
  ========================================================= */

  const getRemainingTime =
    (expiresAt) => {
      const diff =
        new Date(
          expiresAt
        ).getTime() -
        Date.now();

      if (diff <= 0) {
        return "Expired";
      }

      const hours =
        Math.floor(
          diff /
            (1000 *
              60 *
              60)
        );

      const minutes =
        Math.floor(
          (diff %
            (1000 *
              60 *
              60)) /
            (1000 * 60)
        );

      if (hours <= 0) {
        return `${minutes}m left`;
      }

      return `${hours}h ${minutes}m left`;
    };

  /* =========================================================
     HEART
  ========================================================= */

  const sendHeartReaction =
    async () => {
      if (
        !currentStatus?._id
      ) {
        return;
      }

      try {
        const res =
          await fetch(
            `${API_BASE}/api/student/status/${currentStatus._id}/react`,
            {
              method: "POST",
              credentials:
                "include",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify(
                {
                  emoji: "❤️",
                }
              ),
            }
          );

        const text =
          await res.text();

        let data;

        try {
          data =
            JSON.parse(text);
        } catch {
          throw new Error(
            "Server did not return JSON"
          );
        }

        if (!res.ok) {
          throw new Error(
            data.message ||
              "Failed to send heart"
          );
        }

        await fetchStatuses();

        await fetchMyStatuses();
      } catch (err) {
        console.error(
          "Heart reaction error:",
          err
        );

        alert(
          err.message ||
            "Failed to send heart"
        );
      }
    };

  const hasHeartReacted =
    (
      currentStatus?.reactions ||
      []
    ).some(
      (item) =>
        String(
          item.userId
        ) ===
        String(
          loggedInUser?._id
        )
    );

  /* =========================================================
     REPLY
  ========================================================= */

  const sendReplyToStatus =
    async () => {
      if (
        !currentStatus?._id
      ) {
        return;
      }

      if (
        !replyText.trim()
      ) {
        return;
      }

      try {
        setSendingReply(
          true
        );

        const res =
          await fetch(
            `${API_BASE}/api/student/status/${currentStatus._id}/reply`,
            {
              method: "POST",
              credentials:
                "include",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify(
                {
                  text: replyText.trim(),
                }
              ),
            }
          );

        const text =
          await res.text();

        let data;

        try {
          data =
            JSON.parse(text);
        } catch {
          throw new Error(
            "Server did not return JSON"
          );
        }

        if (!res.ok) {
          throw new Error(
            data.message ||
              "Failed to send reply"
          );
        }

        setReplyText("");

        setIsReplyFocused(
          false
        );

        await fetchStatuses();

        await fetchMyStatuses();
      } catch (err) {
        console.error(
          "Reply status error:",
          err
        );

        alert(
          err.message ||
            "Failed to send reply"
        );
      } finally {
        setSendingReply(
          false
        );
      }
    };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDeleteStatus =
    async () => {
      if (
        !currentStatus?._id
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to delete this status permanently?"
        );

      if (!confirmed) {
        return;
      }

      try {
        const res =
          await fetch(
            `${API_BASE}/api/student/status/${currentStatus._id}`,
            {
              method:
                "DELETE",
              credentials:
                "include",
            }
          );

        const text =
          await res.text();

        let data;

        try {
          data =
            JSON.parse(text);
        } catch {
          throw new Error(
            "Server did not return JSON"
          );
        }

        if (!res.ok) {
          throw new Error(
            data.message ||
              "Failed to delete status"
          );
        }

        await fetchStatuses();

        await fetchMyStatuses();

        closeViewer();

        alert(
          data.message ||
            "Status deleted permanently"
        );
      } catch (err) {
        console.error(
          "Delete status error:",
          err
        );

        alert(
          err.message ||
            "Failed to delete status"
        );
      }
    };

  /* =========================================================
     NEW STORY AUTO SCROLL
  ========================================================= */

  useEffect(() => {
    if (
      !newStoryScrollRef.current
    ) {
      return;
    }

    const el =
      stripRef.current;

    if (!el) {
      return;
    }

    setTimeout(() => {
      el.scrollTo({
        left:
          el.scrollWidth,
        behavior:
          "smooth",
      });

      newStoryScrollRef.current =
        false;
    }, 300);
  }, [statuses]);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="student-status-page">
      <div className="student-status-shell">

        {/* =================================================
            STORIES BOARD
        ================================================= */}

        <div className="stories-board">

          <div className="stories-strip-wrap">

            {canScrollLeft && (
              <button
                type="button"
                className="stories-scroll-btn stories-scroll-left"
                onClick={() =>
                  scrollStories(
                    "left"
                  )
                }
              >
                ‹
              </button>
            )}

            <div
              className="stories-strip"
              ref={stripRef}
            >

              {/* YOUR STORY */}

              <button
                type="button"
                className="story-bubble own-story"
                onClick={
                  openCreateModal
                }
              >
                <div className="story-ring own-ring">

                  <div className="story-avatar-box own-avatar-box">

                    <span className="story-plus">
                      +
                    </span>

                  </div>

                </div>

                <span className="story-name">
                  Your Story
                </span>

              </button>

              {/* OTHER STORIES */}

              {groupedStatuses.map(
                (
                  group,
                  index
                ) => (
                  <button
                    key={
                      group.userKey
                    }
                    type="button"
                    className="story-bubble"
                    onClick={() =>
                      openViewer(
                        index
                      )
                    }
                  >

                    <div className="story-ring">

                      <img
                        src={
                          group.profileImage ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            group.author ||
                              "Student"
                          )}&background=e5e7eb&color=111827`
                        }
                        alt={
                          group.author ||
                          "Student"
                        }
                        className="story-avatar"
                      />

                    </div>

                    <span className="story-name">
                      {group.author ||
                        "Student"}
                    </span>

                  </button>
                )
              )}

            </div>

            {canScrollRight && (
              <button
                type="button"
                className="stories-scroll-btn stories-scroll-right"
                onClick={() =>
                  scrollStories(
                    "right"
                  )
                }
              >
                ›
              </button>
            )}

          </div>

          {fetching && (
            <p className="story-info-text">
              Loading stories...
            </p>
          )}

          {!fetching &&
            groupedStatuses.length ===
              0 && (
              <p className="story-info-text">
                No active stories.
                Click Your Story
                to post one.
              </p>
            )}

          {error &&
            !createOpen && (
              <p className="story-info-text">
                {error}
              </p>
            )}

        </div>

        {/* =================================================
            CREATE STATUS MODAL
        ================================================= */}

        {createOpen && (
          <div
            className="create-status-overlay"
            onClick={
              closeCreateModal
            }
          >

            <div
              className="create-status-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="create-modal-head">

                <h2>
                  Create Status
                </h2>

                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={
                    closeCreateModal
                  }
                >
                  ×
                </button>

              </div>

              <form
                className="status-form"
                onSubmit={
                  handleSubmit
                }
              >

                <div className="form-row">

                  <label>
                    Caption
                  </label>

                  <textarea
                    rows="4"
                    placeholder="Write something..."
                    value={
                      form.caption
                    }
                    onChange={(e) =>
                      handleCaptionChange(
                        e.target.value
                      )
                    }
                  />

                </div>

                <div className="form-row">

                  <label>
                    Upload Image / Video
                  </label>

                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={
                      handleMediaChange
                    }
                  />

                </div>

                {/* =================================================
                    CROPPED PREVIEW
                ================================================= */}

                {form.mediaPreview && (
                  <div className="status-preview-box">

                    {form.mediaType ===
                    "image" ? (
                      <img
                        src={
                          form.mediaPreview
                        }
                        alt="preview"
                        className="status-preview-media"
                      />
                    ) : (
                      <video
                        src={
                          form.mediaPreview
                        }
                        controls
                        className="status-preview-media"
                      />
                    )}

                    <button
                      type="button"
                      className="edit-crop-btn"
                      onClick={
                        openCropEditor
                      }
                    >
                      Edit Crop
                    </button>

                  </div>
                )}

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={
                    loading ||
                    cropProcessing
                  }
                >
                  {loading
                    ? "Posting..."
                    : "Post Status"}
                </button>

                {message && (
                  <div className="success-box">
                    {message}
                  </div>
                )}

                {error && (
                  <div className="error-box">
                    {error}
                  </div>
                )}

              </form>

            </div>

          </div>
        )}

        {/* =========================================================
            INSTAGRAM STYLE CROP EDITOR
        ========================================================= */}

        {cropOpen &&
          form.mediaPreview && (

            <div className="status-crop-overlay">

              <div className="status-crop-editor">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="status-crop-header">

                  <button
                    type="button"
                    className="status-crop-back"
                    onClick={
                      closeCropEditor
                    }
                    disabled={
                      cropProcessing
                    }
                  >
                    ←
                  </button>

                  <h3>
                    Crop
                  </h3>

                  <button
                    type="button"
                    className="status-crop-next"
                    onClick={
                      applyCrop
                    }
                    disabled={
                      cropProcessing
                    }
                  >
                    {cropProcessing
                      ? "Processing..."
                      : "Next"}
                  </button>

                </div>

                {/* =================================================
                    CROP AREA
                ================================================= */}

                <div className="status-crop-main">

                  <div className="status-crop-canvas">

                    <Cropper
                      image={
                        form.mediaType ===
                        "image"
                          ? form.mediaPreview
                          : undefined
                      }

                      video={
                        form.mediaType ===
                        "video"
                          ? form.mediaPreview
                          : undefined
                      }

                      crop={crop}

                      zoom={zoom}

                      rotation={
                        rotation
                      }

                      aspect={
                        cropAspect
                      }

                      onCropChange={
                        setCrop
                      }

                      onCropComplete={
                        onCropComplete
                      }

                      onZoomChange={
                        setZoom
                      }

                      showGrid={
                        false
                      }

                      objectFit="contain"

                      restrictPosition={
                        false
                      }
                    />

                  </div>

                </div>

                {/* =================================================
                    CROP CONTROLS
                ================================================= */}

                <div className="status-crop-controls">

                  {/* =================================================
                      RATIO BUTTONS
                  ================================================= */}

                  <div className="crop-ratio-list">

                    {cropRatios.map(
                      (
                        ratio
                      ) => (
                        <button
                          type="button"
                          key={
                            ratio.name
                          }
                          className={
                            cropShapeName ===
                            ratio.name
                              ? "crop-ratio-btn active"
                              : "crop-ratio-btn"
                          }
                          onClick={() =>
                            handleAspectChange(
                              ratio
                            )
                          }
                          disabled={
                            cropProcessing
                          }
                        >

                          <span>
                            {
                              ratio.name
                            }
                          </span>

                          {ratio.name ===
                            "Original" && (
                            <span className="crop-ratio-icon">
                              ▧
                            </span>
                          )}

                        </button>
                      )
                    )}

                  </div>

                  {/* =================================================
                      ZOOM
                  ================================================= */}

                  <div className="crop-tool-row">

                    <button
                      type="button"
                      className="crop-tool-btn"
                      onClick={() =>
                        setZoom(
                          Math.max(
                            1,
                            zoom -
                              0.1
                          )
                        )
                      }
                      disabled={
                        cropProcessing
                      }
                    >
                      −
                    </button>

                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={
                        zoom
                      }
                      onChange={(e) =>
                        setZoom(
                          Number(
                            e
                              .target
                              .value
                          )
                        )
                      }
                      className="crop-zoom-slider"
                      disabled={
                        cropProcessing
                      }
                    />

                    <button
                      type="button"
                      className="crop-tool-btn"
                      onClick={() =>
                        setZoom(
                          Math.min(
                            3,
                            zoom +
                              0.1
                          )
                        )
                      }
                      disabled={
                        cropProcessing
                      }
                    >
                      +
                    </button>

                  </div>

                  {/* =================================================
                      ROTATE / RESET
                  ================================================= */}

                  <div className="crop-extra-tools">

                    <button
                      type="button"
                      className="crop-extra-btn"
                      onClick={() =>
                        setRotation(
                          (
                            rotation -
                            90
                          ) %
                            360
                        )
                      }
                      disabled={
                        cropProcessing
                      }
                    >
                      <RotateCcw
                        size={18}
                      />

                      <span>
                        Rotate
                      </span>
                    </button>

                    <button
                      type="button"
                      className="crop-extra-btn"
                      onClick={() => {
                        setCrop({
                          x: 0,
                          y: 0,
                        });

                        setZoom(
                          1
                        );

                        setRotation(
                          0
                        );
                      }}
                      disabled={
                        cropProcessing
                      }
                    >
                      <Maximize
                        size={18}
                      />

                      <span>
                        Reset
                      </span>
                    </button>

                  </div>

                </div>

              </div>

            </div>
          )}

        {/* =================================================
            STORY VIEWER
        ================================================= */}

        {viewerOpen &&
          currentStatus &&
          activeGroup && (

            <div
              className="ig-story-overlay"
              onClick={
                closeViewer
              }
            >

              {/* CLOSE */}

              <button
                type="button"
                className="ig-global-close"
                onClick={
                  closeViewer
                }
              >
                ×
              </button>

              {/* =================================================
                  PREVIOUS SIDE
              ================================================= */}

              <div className="ig-side-preview ig-side-preview-left">

                {activeGroupIndex >
                  0 &&
                  groupedStatuses[
                    activeGroupIndex -
                      1
                  ] && (

                    <button
                      type="button"
                      className="ig-side-card"
                      onClick={(e) => {
                        e.stopPropagation();

                        setActiveGroupIndex(
                          (
                            prev
                          ) =>
                            prev -
                            1
                        );

                        setActiveStoryIndex(
                          0
                        );
                      }}
                    >

                      <img
                        src={
                          groupedStatuses[
                            activeGroupIndex -
                              1
                          ].stories?.[
                            0
                          ]?.imageUrl ||
                          groupedStatuses[
                            activeGroupIndex -
                              1
                          ].profileImage ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            groupedStatuses[
                              activeGroupIndex -
                                1
                            ].author ||
                              "Student"
                          )}&background=e5e7eb&color=111827`
                        }
                        alt="previous story"
                        className="ig-side-bg"
                      />

                      <div className="ig-side-overlay">

                        <img
                          src={
                            groupedStatuses[
                              activeGroupIndex -
                                1
                            ].profileImage ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              groupedStatuses[
                                activeGroupIndex -
                                  1
                              ].author ||
                                "Student"
                            )}&background=e5e7eb&color=111827`
                          }
                          alt="profile"
                          className="ig-side-avatar"
                        />

                        <span>
                          {
                            groupedStatuses[
                              activeGroupIndex -
                                1
                            ].author
                          }
                        </span>

                      </div>

                    </button>
                  )}

              </div>

              {/* =================================================
                  CENTER
              ================================================= */}

              <div className="ig-story-center">

                <button
                  type="button"
                  className="ig-nav ig-nav-left"
                  onClick={(e) => {
                    e.stopPropagation();

                    handlePrev();
                  }}
                  disabled={
                    activeGroupIndex ===
                      0 &&
                    activeStoryIndex ===
                      0
                  }
                >
                  ‹
                </button>

                {/* =================================================
                    MAIN VIEWER
                ================================================= */}

                <div
                  className="ig-story-viewer insta-story-viewer"
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                >

                  {/* TOP */}

                  <div className="ig-story-top">

                    <div className="ig-progress-wrap">

                      {activeGroup.stories.map(
                        (
                          _,
                          i
                        ) => (
                          <span
                            key={i}
                            className={`ig-progress-bar ${
                              i <
                              activeStoryIndex
                                ? "done"
                                : i ===
                                    activeStoryIndex
                                  ? "active"
                                  : ""
                            }`}
                          />
                        )
                      )}

                    </div>

                    <div className="ig-story-userbar">

                      <div className="ig-story-userleft">

                        <img
                          src={
                            activeGroup.profileImage ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              activeGroup.author ||
                                "Student"
                            )}&background=e5e7eb&color=111827`
                          }
                          alt={
                            activeGroup.author ||
                            "Student"
                          }
                          className="ig-story-user-avatar"
                        />

                        <div className="ig-story-usertext">

                          <h4>
                            {activeGroup.author ||
                              "Student"}
                          </h4>

                          <p>
                            {getRemainingTime(
                              currentStatus.expiresAt
                            )}
                          </p>

                        </div>

                      </div>

                      <div className="insta-top-actions">

                        {isOwnStatus && (
                          <button
                            type="button"
                            className="story-delete-btn"
                            onClick={
                              handleDeleteStatus
                            }
                          >
                            Delete
                          </button>
                        )}

                      </div>

                    </div>

                  </div>

                  {/* MAIN MEDIA */}

                  <div className="ig-story-main">

                    <div className="ig-story-media-wrap">

                      {currentStatus.mediaType ===
                      "image" ? (
                        <img
                          src={
                            currentStatus.imageUrl
                          }
                          alt="story"
                          className="ig-story-media"
                        />
                      ) : (
                        <video
                          ref={
                            videoRef
                          }
                          src={
                            currentStatus.videoUrl
                          }
                          className="ig-story-media"
                          controls
                          autoPlay
                          playsInline
                          onEnded={
                            handleNext
                          }
                        />
                      )}

                      {currentStatus.caption && (
                        <div className="insta-story-caption">
                          {
                            currentStatus.caption
                          }
                        </div>
                      )}

                    </div>

                  </div>

                  {/* BOTTOM */}

                  <div className="ig-story-bottom">

                    {isOwnStatus ? (
                      <div className="full-width-insights">

                        <button
                          type="button"
                          className="story-views-trigger"
                          onClick={() =>
                            setShowViewSheet(
                              (
                                prev
                              ) =>
                                !prev
                            )
                          }
                        >

                          <div className="story-viewers-mini">

                            {filteredViewers
                              .slice(
                                0,
                                3
                              )
                              .map(
                                (
                                  viewer,
                                  index
                                ) => (
                                  <img
                                    key={
                                      index
                                    }
                                    src={
                                      viewer.profileImage ||
                                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                        viewer.name ||
                                          "User"
                                      )}&background=e5e7eb&color=111827`
                                    }
                                    alt={
                                      viewer.name ||
                                      "viewer"
                                    }
                                    className="story-mini-avatar"
                                  />
                                )
                              )}

                          </div>

                          <div className="story-view-count-text">

                            <strong>
                              {
                                filteredViewers.length
                              }
                            </strong>{" "}
                            views

                          </div>

                        </button>

                      </div>
                    ) : (
                      <>
                        <div className="insta-reply-box">

                          <input
                            type="text"
                            placeholder={`Reply to ${
                              activeGroup.author ||
                              "story"
                            }...`}
                            value={
                              replyText
                            }
                            onChange={(e) =>
                              setReplyText(
                                e
                                  .target
                                  .value
                              )
                            }
                            onFocus={() =>
                              setIsReplyFocused(
                                true
                              )
                            }
                            onBlur={() =>
                              setIsReplyFocused(
                                false
                              )
                            }
                          />

                        </div>

                        <div className="insta-story-actions">

                          <button
                            type="button"
                            onClick={
                              sendHeartReaction
                            }
                            className={
                              hasHeartReacted
                                ? "story-heart-btn active"
                                : "story-heart-btn"
                            }
                          >

                            <Heart
                              size={
                                20
                              }
                              className="story-heart-icon-ui"
                            />

                          </button>

                          <button
                            type="button"
                            className="insta-send-btn"
                            onClick={
                              sendReplyToStatus
                            }
                          >
                            {sendingReply
                              ? "..."
                              : "Send"}
                          </button>

                        </div>
                      </>
                    )}

                  </div>

                </div>

                {/* RIGHT */}

                <button
                  type="button"
                  className="ig-nav ig-nav-right"
                  onClick={(e) => {
                    e.stopPropagation();

                    handleNext();
                  }}
                  disabled={
                    activeGroupIndex ===
                      groupedStatuses.length -
                        1 &&
                    activeStoryIndex ===
                      activeGroup
                        .stories
                        .length -
                        1
                  }
                >
                  ›
                </button>

              </div>

              {/* =================================================
                  NEXT SIDE
              ================================================= */}

              <div className="ig-side-preview ig-side-preview-right">

                {activeGroupIndex <
                  groupedStatuses.length -
                    1 &&
                  groupedStatuses[
                    activeGroupIndex +
                      1
                  ] && (

                    <button
                      type="button"
                      className="ig-side-card"
                      onClick={(e) => {
                        e.stopPropagation();

                        setActiveGroupIndex(
                          (
                            prev
                          ) =>
                            prev +
                            1
                        );

                        setActiveStoryIndex(
                          0
                        );
                      }}
                    >

                      <img
                        src={
                          groupedStatuses[
                            activeGroupIndex +
                              1
                          ].stories?.[
                            0
                          ]?.imageUrl ||
                          groupedStatuses[
                            activeGroupIndex +
                              1
                          ].profileImage ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            groupedStatuses[
                              activeGroupIndex +
                                1
                            ].author ||
                              "Student"
                          )}&background=e5e7eb&color=111827`
                        }
                        alt="next story"
                        className="ig-side-bg"
                      />

                      <div className="ig-side-overlay">

                        <img
                          src={
                            groupedStatuses[
                              activeGroupIndex +
                                1
                            ].profileImage ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              groupedStatuses[
                                activeGroupIndex +
                                  1
                              ].author ||
                                "Student"
                            )}&background=e5e7eb&color=111827`
                          }
                          alt="profile"
                          className="ig-side-avatar"
                        />

                        <span>
                          {
                            groupedStatuses[
                              activeGroupIndex +
                                1
                            ].author
                          }
                        </span>

                      </div>

                    </button>
                  )}

              </div>

            </div>
          )}

        {/* =================================================
            VIEW SHEET
        ================================================= */}

        {showViewSheet &&
          currentStatus && (

            <div
              className="story-view-sheet-overlay"
              onClick={() =>
                setShowViewSheet(
                  false
                )
              }
            >

              <div
                className="story-view-sheet"
                onClick={(e) =>
                  e.stopPropagation()
                }
              >

                <div className="story-view-sheet-head">

                  <h3>
                    Views & Reactions
                  </h3>

                  <button
                    type="button"
                    onClick={() =>
                      setShowViewSheet(
                        false
                      )
                    }
                  >
                    ×
                  </button>

                </div>

                <div className="story-view-section">

                  <h4>
                    Viewed by (
                    {
                      filteredViewers.length
                    }
                    )
                  </h4>

                  {filteredViewers.length ===
                  0 ? (
                    <p className="story-empty-text">
                      No views yet
                    </p>
                  ) : (
                    filteredViewers.map(
                      (
                        viewer,
                        index
                      ) => (
                        <div
                          key={
                            index
                          }
                          className="story-user-row"
                        >

                          <img
                            src={
                              viewer.profileImage ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                viewer.name ||
                                  "User"
                              )}&background=e5e7eb&color=111827`
                            }
                            alt={
                              viewer.name ||
                              "viewer"
                            }
                            className="story-user-row-avatar"
                          />

                          <div>
                            <strong>
                              {
                                viewer.name ||
                                "User"
                              }
                            </strong>
                          </div>

                        </div>
                      )
                    )
                  )}

                </div>

                <div className="story-view-section">

                  <h4>
                    Hearts (
                    {currentStatus
                      .reactions
                      ?.length ||
                      0}
                    )
                  </h4>

                  {(
                    currentStatus.reactions ||
                    []
                  ).length ===
                  0 ? (
                    <p className="story-empty-text">
                      No hearts yet
                    </p>
                  ) : (
                    currentStatus.reactions.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={
                            index
                          }
                          className="story-user-row"
                        >

                          <img
                            src={
                              item.profileImage ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                item.name ||
                                  "User"
                              )}&background=e5e7eb&color=111827`
                            }
                            alt={
                              item.name ||
                              "user"
                            }
                            className="story-user-row-avatar"
                          />

                          <div>
                            <strong>
                              {
                                item.name ||
                                "User"
                              }
                            </strong>
                          </div>

                          <span className="story-heart-icon">
                            {
                              item.emoji ||
                              "❤️"
                            }
                          </span>

                        </div>
                      )
                    )
                  )}

                </div>

              </div>

            </div>
          )}

      </div>
    </div>
  );
}