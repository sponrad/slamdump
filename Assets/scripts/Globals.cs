using UnityEngine;

public class Globals : MonoBehaviour 
{
	public static Globals GM;

	public static bool sound = true;


	void Awake()
	{

		if(GM != null)
			GameObject.Destroy(GM);
		else
			GM = this;
		DontDestroyOnLoad(this);
	}
}