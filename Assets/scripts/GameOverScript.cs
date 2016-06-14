using UnityEngine;
using System.Collections;
using UnityEngine.UI;
using GooglePlayGames;
using GooglePlayGames.BasicApi;
using UnityEngine.SocialPlatforms;

public class GameOverScript : MonoBehaviour {

	public Text scoreText;
	public Text messageText;

	// Use this for initialization
	void Start () {
		scoreText.text = Globals.score.ToString();
		messageText.text = "";

		int prevScore = 0;

		if (PlayerPrefs.HasKey ("highScore")) {
			prevScore = PlayerPrefs.GetInt ("highScore");
			if (Globals.score > prevScore) {
				messageText.text = "New High Score!";
				PlayerPrefs.SetInt ("highScore", Globals.score);
				PlayerPrefs.Save ();
			}
		} else {
			PlayerPrefs.SetInt ("highScore", Globals.score);
			PlayerPrefs.Save ();
		}
			

		Social.ReportScore(Globals.score, scripts.GPGIds.leaderboard_high_score, (bool success) => {
			// handle success or failure
		});
	}
	
	// Update is called once per frame
	void Update () {
	
	}

	public void ShowLeaderboard(){
		PlayGamesPlatform.Instance.ShowLeaderboardUI (scripts.GPGIds.leaderboard_high_score);
	}
}
