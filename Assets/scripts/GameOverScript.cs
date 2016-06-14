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

		PlayGamesPlatform.Instance.LoadScores(
			scripts.GPGIds.leaderboard_high_score,
			LeaderboardStart.PlayerCentered,
			1,
			LeaderboardCollection.Public,
			LeaderboardTimeSpan.AllTime,
			(data) =>
			{
				prevScore = (int)data.PlayerScore.value;
				if (Globals.score > prevScore){
					messageText.text = "New High Score!";
				}
			
			});

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
