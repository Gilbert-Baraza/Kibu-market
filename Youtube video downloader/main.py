import sys

try:
    import yt_dlp
except ModuleNotFoundError:
    print("Missing dependency: yt-dlp")
    print("Install it with:")
    print(f'  "{sys.executable}" -m pip install yt-dlp')
    raise SystemExit(1)


def download_youtube_video(url, output_folder="."):
    """
    Downloads a YouTube video using yt-dlp.

    :param url: The URL of the YouTube video.
    :param output_folder: The directory where the video will be saved (defaults to current directory).
    """
    ydl_opts = {
        "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "outtmpl": f"{output_folder}/%(title)s.%(ext)s",
        "noplaylist": True,
        "quiet": False,
    }

    try:
        print(f"Fetching data for: {url}...")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        print("\nDownload completed successfully!")
    except yt_dlp.utils.DownloadError as e:
        print(f"\nDownload failed: {e}")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")


if __name__ == "__main__":
    print("--- YouTube Video Downloader ---")
    video_url = input("Enter the YouTube video URL: ").strip()

    if video_url:
        download_youtube_video(video_url)
    else:
        print("No URL provided. Exiting.")
