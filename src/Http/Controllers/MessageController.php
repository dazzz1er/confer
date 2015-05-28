<?php

namespace DJB\Confer\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests;
use App\User;
use Auth;
use DJB\Confer\Commands\MessageWasSent;
use DJB\Confer\Confer;
use DJB\Confer\Conversation;
use DJB\Confer\Message;
use Illuminate\Http\Request;
use Push;
use Pusher;

class MessageController extends Controller {
	
	protected $user;
	protected $confer;

	public function __construct(Confer $confer)
	{
		$this->middleware('auth');
		$this->user = Auth::user();
		$this->confer = $confer;
	}

	/**
	 * Store a new instance of a message in the conversation
	 * 
	 * @param  Conversation $conversation
	 * @param  Request      $request
	 * @return Response
	 */
	public function store(Conversation $conversation, Request $request)
	{
		$message = Message::create([
			'body' => config('confer.enable_emoji') ? confer_convert_emoji_to_shortcodes(strip_tags($request->input('body'))) : strip_tags($request->input('body')),
			'conversation_id' => $conversation->id,
			'sender_id' => $this->user->id,
			'type' => 'user_message'
		]);
		$this->dispatch(new MessageWasSent($message));
		return $message->load('sender');
	}

}